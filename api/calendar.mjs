// /api/calendar — Barry Burris, NMD · Calendar sync backend.
//
// House pattern (Accelerated Experiences, LLC): Vercel Node serverless (ESM), env-gated,
// dependency-free (raw fetch to Upstash/Vercel KV REST) — same shape as /api/connect.
//
// Solo-practice scope: one shared appointment list, synced across every device that opens
// barry-calendar.html. Also backs /api/calendar-feed (the read-only Apple/Google
// "subscribe" .ics feed) via the same stored event list and a stable feed token.
//
// DEGRADES GRACEFULLY: if no KV env is set, every action returns 200 { ok:false,
// reason:'no_kv' } and the calendar page falls back to its existing on-device-only
// localStorage behavior — nothing breaks, it just doesn't sync yet. Keys come from env only:
//   KV_REST_API_URL + KV_REST_API_TOKEN   (Vercel KV)   — or —
//   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN   (Upstash direct)

const NS = 'bb:cal:';
const EVENTS_KEY = NS + 'events';
const TOKEN_KEY = NS + 'feedtoken';

// ---- KV (Upstash REST, single-command style) ----
function kvCreds() {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
  const tok = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
  return url && tok ? { url, tok } : null;
}
async function kv(cmd) {
  const c = kvCreds();
  if (!c) throw new Error('no_kv');
  const r = await fetch(c.url, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + c.tok, 'content-type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) { const e = new Error((j && j.error) || ('kv ' + r.status)); e.status = r.status; throw e; }
  return j ? j.result : null;
}
const getJSON = async (k, d) => { try { const v = await kv(['GET', k]); return v == null ? d : JSON.parse(v); } catch { return d; } };
const setJSON = (k, v) => kv(['SET', k, JSON.stringify(v)]);

// ---- HTTP plumbing ----
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
}
function json(res, code, obj) {
  res.statusCode = code;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(obj));
}
async function readBody(req) {
  if (req.body != null) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  }
  const chunks = [];
  try { for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c); } catch { return {}; }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}
const clip = (s, n) => String(s == null ? '' : s).slice(0, n);
const now = () => Date.now();
function randToken(n) {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// A stored event is: {id, title, type, resource, start, end, allDay, mode, notes, updatedAt}.
// start/end are the SAME "YYYY-MM-DDTHH:MM" (or "YYYY-MM-DD" for all-day) local strings the
// calendar UI already uses — kept as-is so the KV copy and the FullCalendar UI never disagree.
function sanitizeEvent(e, existingId) {
  const id = existingId || clip(e.id, 40) || ('e' + now().toString(36) + Math.floor(Math.random() * 900 + 100));
  return {
    id,
    title: clip(e.title, 200),
    type: clip(e.type, 40),
    resource: clip(e.resource, 120),
    start: clip(e.start, 40),
    end: clip(e.end, 40),
    allDay: !!e.allDay,
    mode: clip(e.mode, 40),
    notes: clip(e.notes, 2000),
    updatedAt: now()
  };
}

async function list() {
  const events = await getJSON(EVENTS_KEY, []);
  return { ok: true, events };
}
async function save(p) {
  if (!p.title || !String(p.title).trim()) return { ok: false, reason: 'bad_args', message: 'title required' };
  if (!p.start) return { ok: false, reason: 'bad_args', message: 'start required' };
  const events = await getJSON(EVENTS_KEY, []);
  const i = p.id ? events.findIndex((x) => x.id === p.id) : -1;
  const ev = sanitizeEvent(p, i >= 0 ? events[i].id : null);
  if (i >= 0) events[i] = ev; else events.push(ev);
  await setJSON(EVENTS_KEY, events);
  return { ok: true, event: ev };
}
async function remove(p) {
  const id = clip(p.id, 40);
  if (!id) return { ok: false, reason: 'bad_args' };
  const events = await getJSON(EVENTS_KEY, []);
  const next = events.filter((x) => x.id !== id);
  await setJSON(EVENTS_KEY, next);
  return { ok: true, removed: events.length !== next.length };
}
// One-time-safe merge: takes whatever's sitting in a browser's localStorage (from before
// sync existed, or from a device that's been offline) and folds it into the shared KV list
// without duplicating anything already synced. Existing ids win over incoming duplicates.
async function migrate(p) {
  const incoming = Array.isArray(p.events) ? p.events : [];
  if (!incoming.length) return { ok: true, added: 0 };
  const events = await getJSON(EVENTS_KEY, []);
  const haveIds = new Set(events.map((x) => x.id));
  let added = 0;
  for (const raw of incoming) {
    if (raw && raw.id && haveIds.has(raw.id)) continue;
    events.push(sanitizeEvent(raw, raw && raw.id));
    added++;
  }
  if (added) await setJSON(EVENTS_KEY, events);
  return { ok: true, added };
}
// The .ics subscribe feed is unauthenticated by design (that's how every calendar app's
// "secret address in iCal format" works) — its security is an unguessable token in the URL,
// generated once and kept stable so Barry doesn't have to re-subscribe after every visit.
async function feedUrl(p) {
  let token = await getJSON(TOKEN_KEY, null);
  if (!token) { token = randToken(28); await setJSON(TOKEN_KEY, token); }
  const origin = clip(p.origin, 200) || '';
  return { ok: true, token, path: '/api/calendar-feed?key=' + token, url: origin ? origin + '/api/calendar-feed?key=' + token : null };
}

const ACT = { list, save, delete: remove, migrate, feedUrl, ping: async () => ({ ok: true, ts: now() }) };

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (!kvCreds()) return json(res, 200, { ok: false, reason: 'no_kv' }); // env-gated: safe + dormant

  let body = {};
  if (req.method === 'POST') { try { body = await readBody(req); } catch { body = {}; } }
  const url = new URL(req.url, 'http://x');
  const doName = body.do || url.searchParams.get('do') || (req.method === 'GET' ? 'list' : '');
  const fn = ACT[doName];
  if (!fn) return json(res, 400, { ok: false, reason: 'bad_action', message: 'unknown action: ' + doName });
  try {
    const out = await fn(Object.assign({}, url.searchParams ? Object.fromEntries(url.searchParams) : {}, body));
    return json(res, 200, out);
  } catch (e) {
    if (String(e && e.message) === 'no_kv') return json(res, 200, { ok: false, reason: 'no_kv' });
    return json(res, 200, { ok: false, reason: 'error', message: clip(e && e.message, 200) });
  }
}

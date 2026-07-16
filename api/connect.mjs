// /api/connect — Barry Burris, NMD · Connect backend (native video signaling + 1:1 messaging).
//
// House pattern (Accelerated Experiences, LLC): Vercel Node serverless (ESM), env-gated,
// dependency-free (raw fetch to Upstash/Vercel KV REST). Scope for Barry = a SOLO practice:
//   • RTC signaling  (rtcJoin / rtcPoll / rtcSignal / rtcLeave)  — GUEST-CAPABLE
//       (an outside patient has no account; the unguessable room id is the capability).
//       Carries only SDP/ICE/relay-chat — NO PHI — so KV signaling is HIPAA-safe.
//   • 1:1 messaging  (send / thread / inbox)  — provider <-> one patient.
//       Stores the ORIGINAL text + the sender's language; the client translates on read.
//       ** DEMO / NON-PHI MODE ** until message bodies are encrypted at rest or moved to a
//       BAA-covered store (see HIPAA plan). Identity is client-asserted in this mode.
//   NO channels / live-rooms (those are the org build).
//
// DEGRADES GRACEFULLY: if no KV env is set it returns 200 { ok:false, reason:'no_kv' } so the
// UI shows "coming online" and the hub never breaks. Keys come from env only:
//   KV_REST_API_URL + KV_REST_API_TOKEN   (Vercel KV)   — or —
//   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN   (Upstash direct)

const NS = 'bb:connect:';
const ROSTER_TTL = 60;     // seconds a room roster key lives
const PEER_STALE = 22000;  // ms after which a silent peer is pruned from the roster
const BOX_TTL = 90;        // seconds a per-peer signaling mailbox lives
const THREAD_MAX = 500;    // messages kept per 1:1 thread

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
const setJSON = (k, v, ex) => kv(ex ? ['SET', k, JSON.stringify(v), 'EX', String(ex)] : ['SET', k, JSON.stringify(v)]);

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
const slug = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 80);
const now = () => Date.now();

// ================= RTC signaling (guest-capable) =================
// Roster key holds { peerId: {name, ts} }. Mailbox is a Redis list of queued signals.
async function rtcJoin(p) {
  const room = clip(p.room, 200), peer = clip(p.peer, 80);
  if (!room || !peer) return { ok: false, reason: 'bad_args' };
  const rk = NS + 'rtcroom:' + room;
  const roster = await getJSON(rk, {});
  const t = now();
  for (const id in roster) if (t - (roster[id].ts || 0) > PEER_STALE) delete roster[id];
  roster[peer] = { name: clip(p.name, 80) || 'Guest', ts: t };
  await setJSON(rk, roster, ROSTER_TTL);
  return { ok: true, peers: Object.keys(roster).filter((id) => id !== peer).map((id) => ({ id, name: roster[id].name })) };
}
async function rtcPoll(p) {
  const room = clip(p.room, 200), peer = clip(p.peer, 80);
  if (!room || !peer) return { ok: false, reason: 'bad_args' };
  const rk = NS + 'rtcroom:' + room;
  const roster = await getJSON(rk, {});
  const t = now();
  for (const id in roster) if (t - (roster[id].ts || 0) > PEER_STALE) delete roster[id];
  if (roster[peer]) roster[peer].ts = t; else roster[peer] = { name: clip(p.name, 80) || 'Guest', ts: t };
  await setJSON(rk, roster, ROSTER_TTL);
  // drain this peer's mailbox atomically-ish
  const bk = NS + 'rtcbox:' + room + ':' + peer;
  let msgs = [];
  try {
    const res = await kv(['LRANGE', bk, '0', '-1']);
    if (Array.isArray(res) && res.length) { await kv(['DEL', bk]); msgs = res.map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean); }
  } catch {}
  return { ok: true, peers: Object.keys(roster).filter((id) => id !== peer).map((id) => ({ id, name: roster[id].name })), msgs };
}
async function rtcSignal(p) {
  const room = clip(p.room, 200), to = clip(p.to, 80), from = clip(p.from, 80);
  if (!room || !to || !from) return { ok: false, reason: 'bad_args' };
  const payload = { from, data: p.data || {}, ts: now() };
  const bk = NS + 'rtcbox:' + room + ':' + to;
  try { await kv(['RPUSH', bk, JSON.stringify(payload)]); await kv(['EXPIRE', bk, String(BOX_TTL)]); } catch (e) { if (String(e.message) === 'no_kv') throw e; }
  return { ok: true };
}
async function rtcLeave(p) {
  const room = clip(p.room, 200), peer = clip(p.peer, 80);
  if (!room || !peer) return { ok: false, reason: 'bad_args' };
  const rk = NS + 'rtcroom:' + room;
  const roster = await getJSON(rk, {});
  delete roster[peer];
  await setJSON(rk, roster, ROSTER_TTL);
  try { await kv(['DEL', NS + 'rtcbox:' + room + ':' + peer]); } catch {}
  return { ok: true };
}

// ================= 1:1 messaging (demo / non-PHI) =================
// thread key = the PATIENT's stable key. A message = {from, role, name, text, lang, ts}.
function patientKeyOf(p) { return slug((p.role === 'patient') ? (p.me || p.from) : (p.to || p.patient)); }
async function msgSend(p) {
  const pk = patientKeyOf(p);
  const text = clip(p.text, 4000);
  if (!pk || !text) return { ok: false, reason: 'bad_args' };
  const role = p.role === 'patient' ? 'patient' : 'provider';
  const msg = { from: clip(p.me || p.from, 80), role, name: clip(p.name, 80), text, lang: clip(p.lang, 12) || (role === 'provider' ? 'en' : ''), ts: now() };
  const tk = NS + 'thread:' + pk;
  try {
    await kv(['RPUSH', tk, JSON.stringify(msg)]);
    await kv(['LTRIM', tk, String(-THREAD_MAX), '-1']);
  } catch (e) { if (String(e.message) === 'no_kv') throw e; }
  // provider inbox index
  const idx = await getJSON(NS + 'threads', {});
  idx[pk] = { key: pk, name: clip(p.patientName || (role === 'patient' ? p.name : idx[pk] && idx[pk].name), 80) || pk, lastText: text, lastRole: role, lastTs: msg.ts };
  await setJSON(NS + 'threads', idx);
  return { ok: true, ts: msg.ts };
}
async function msgThread(p) {
  const pk = slug(p.with || p.patientKey || patientKeyOf(p));
  if (!pk) return { ok: false, reason: 'bad_args' };
  let raw = [];
  try { raw = await kv(['LRANGE', NS + 'thread:' + pk, '0', '-1']) || []; } catch (e) { if (String(e.message) === 'no_kv') throw e; }
  const msgs = raw.map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
  return { ok: true, patientKey: pk, msgs };
}
async function msgInbox(p) {
  if (p.role === 'patient') { const pk = slug(p.me || p.from); return { ok: true, patientKey: pk }; }
  const idx = await getJSON(NS + 'threads', {});
  const list = Object.values(idx).sort((a, b) => (b.lastTs || 0) - (a.lastTs || 0));
  return { ok: true, threads: list };
}

// ================= handler =================
const ACT = {
  rtcJoin, rtcPoll, rtcSignal, rtcLeave,
  send: msgSend, thread: msgThread, inbox: msgInbox,
  ping: async () => ({ ok: true, ts: now() })
};

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (!kvCreds()) return json(res, 200, { ok: false, reason: 'no_kv' }); // env-gated: safe + dormant

  let body = {};
  if (req.method === 'POST') { try { body = await readBody(req); } catch { body = {}; } }
  const url = new URL(req.url, 'http://x');
  const doName = body.do || url.searchParams.get('do') || '';
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

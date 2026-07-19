// /api/contacts — Barry Burris, NMD · CRM sync backend.
//
// House pattern (Accelerated Experiences, LLC): Vercel Node serverless (ESM), env-gated,
// dependency-free (raw fetch to Upstash/Vercel KV REST) — same shape as /api/connect and
// /api/calendar.
//
// Solo-practice scope: one shared contact list, synced across every device that opens
// barry-contacts.html. Contact & scheduling info only — no diagnoses or labs (same Lane A
// data-sensitivity boundary the page has always disclosed; this just makes it cross-device
// instead of trapped in one browser).
//
// DEGRADES GRACEFULLY: if no KV env is set, every action returns 200 { ok:false,
// reason:'no_kv' } and the page falls back to its existing on-device-only localStorage
// behavior — nothing breaks, it just doesn't sync yet. Keys come from env only:
//   KV_REST_API_URL + KV_REST_API_TOKEN   (Vercel KV)   — or —
//   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN   (Upstash direct)

const NS = 'bb:contacts:';
const ALL_KEY = NS + 'all';

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

// Mirrors the client's own nameOf()/normalize() so dedup and display logic never disagree
// between the on-device fallback and the synced copy.
function nameOf(c) {
  if (c.kind === 'business') return c.account || ((c.firstName || '') + ' ' + (c.lastName || '')).trim();
  return (((c.firstName || '') + ' ' + (c.lastName || '')).trim() || c.account || '(no name)');
}
function normalizeTags(t) {
  if (Array.isArray(t)) return t.map((x) => clip(x, 60)).filter(Boolean);
  if (typeof t === 'string') return t.split(',').map((x) => x.trim()).filter(Boolean);
  return [];
}
function sanitizeContact(raw, existing) {
  const c = Object.assign({}, existing || {}, raw || {});
  const kind = c.kind || ((c.account && !c.firstName && !c.lastName) ? 'business' : 'person');
  const custom = {};
  if (c.custom && typeof c.custom === 'object') {
    Object.keys(c.custom).slice(0, 50).forEach((k) => { custom[clip(k, 60)] = clip(c.custom[k], 500); });
  }
  return {
    id: c.id || ('c' + now().toString(36) + Math.random().toString(36).slice(2, 6)),
    accountNo: c.accountNo || '',
    kind,
    type: clip(c.type, 40),
    firstName: clip(c.firstName, 100),
    lastName: clip(c.lastName, 100),
    account: clip(c.account, 160),
    email: clip(c.email, 160),
    phone: clip(c.phone, 60),
    address: clip(c.address, 200),
    city: clip(c.city, 100),
    state: clip(c.state, 60),
    zip: clip(c.zip, 20),
    status: clip(c.status, 40),
    program: clip(c.program, 160),
    source: clip(c.source, 160),
    specialty: clip(c.specialty, 200),
    tags: normalizeTags(c.tags),
    notes: clip(c.notes, 4000),
    custom,
    createdAt: c.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
function nextAccountNo(list) {
  let mx = 1000;
  list.forEach((c) => { const n = parseInt(String(c.accountNo || '').replace(/\D/g, ''), 10); if (n > mx) mx = n; });
  return 'C-' + (mx + 1);
}
function isDup(a, b) {
  if (a.email && b.email && a.email.toLowerCase() === b.email.toLowerCase()) return true;
  return nameOf(a).toLowerCase() === nameOf(b).toLowerCase() && (a.city || '') === (b.city || '');
}

async function list() {
  const all = await getJSON(ALL_KEY, []);
  return { ok: true, contacts: all };
}
async function add(p) {
  const all = await getJSON(ALL_KEY, []);
  const c = sanitizeContact(p.contact || {});
  c.accountNo = nextAccountNo(all);
  all.push(c);
  await setJSON(ALL_KEY, all);
  return { ok: true, contact: c };
}
async function update(p) {
  const id = clip(p.id, 40);
  if (!id) return { ok: false, reason: 'bad_args' };
  const all = await getJSON(ALL_KEY, []);
  const i = all.findIndex((x) => x.id === id);
  if (i < 0) return { ok: false, reason: 'not_found' };
  all[i] = sanitizeContact(p.patch || {}, all[i]);
  await setJSON(ALL_KEY, all);
  return { ok: true, contact: all[i] };
}
async function remove(p) {
  const id = clip(p.id, 40);
  if (!id) return { ok: false, reason: 'bad_args' };
  const all = await getJSON(ALL_KEY, []);
  const next = all.filter((x) => x.id !== id);
  await setJSON(ALL_KEY, next);
  return { ok: true, removed: all.length !== next.length };
}
// CSV import: same dedup rule as the client (email match, or name+city match) — skips
// duplicates rather than fabricating merges.
async function doImport(p) {
  const incoming = Array.isArray(p.rows) ? p.rows : [];
  if (!incoming.length) return { ok: true, added: 0, skipped: 0 };
  const all = await getJSON(ALL_KEY, []);
  let added = 0, skipped = 0;
  for (const raw of incoming) {
    const c = sanitizeContact(raw);
    const dup = all.some((x) => isDup(x, c));
    if (dup) { skipped++; continue; }
    c.accountNo = nextAccountNo(all);
    all.push(c);
    added++;
  }
  if (added) await setJSON(ALL_KEY, all);
  return { ok: true, added, skipped };
}
// One-time-safe fold of a device's pre-sync localStorage contacts into the shared list —
// same dedup rule, existing ids/records win over incoming duplicates.
async function migrate(p) {
  const incoming = Array.isArray(p.contacts) ? p.contacts : [];
  if (!incoming.length) return { ok: true, added: 0 };
  const all = await getJSON(ALL_KEY, []);
  let added = 0;
  for (const raw of incoming) {
    const c = sanitizeContact(raw);
    const dup = all.some((x) => isDup(x, c) || (raw.id && x.id === raw.id));
    if (dup) continue;
    c.accountNo = c.accountNo || nextAccountNo(all);
    all.push(c);
    added++;
  }
  if (added) await setJSON(ALL_KEY, all);
  return { ok: true, added };
}
// Bulk tag/flag helper: applies the same tag set to multiple contacts by id in one round
// trip — used when flagging a batch of "probable practice partner" businesses for filtering.
async function tag(p) {
  const ids = Array.isArray(p.ids) ? p.ids.map((x) => clip(x, 40)) : [];
  const addTags = normalizeTags(p.addTags);
  const removeTags = normalizeTags(p.removeTags);
  if (!ids.length || (!addTags.length && !removeTags.length)) return { ok: false, reason: 'bad_args' };
  const all = await getJSON(ALL_KEY, []);
  const idSet = new Set(ids);
  let touched = 0;
  all.forEach((c) => {
    if (!idSet.has(c.id)) return;
    const set = new Set(c.tags || []);
    addTags.forEach((t) => set.add(t));
    removeTags.forEach((t) => set.delete(t));
    c.tags = Array.from(set);
    c.updatedAt = new Date().toISOString();
    touched++;
  });
  if (touched) await setJSON(ALL_KEY, all);
  return { ok: true, touched };
}

const ACT = { list, add, update, delete: remove, import: doImport, migrate, tag, ping: async () => ({ ok: true, ts: now() }) };

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (!kvCreds()) return json(res, 200, { ok: false, reason: 'no_kv' }); // env-gated: safe + dormant

  let body = {};
  if (req.method === 'POST') { try { body = await readBody(req); } catch { body = {}; } }
  const url = new URL(req.url, 'http://x');
  const doName = body.do || body.action || url.searchParams.get('do') || (req.method === 'GET' ? 'list' : '');
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

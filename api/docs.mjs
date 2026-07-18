// /api/docs — Barry Burris, NMD · practice document library (real word processor backend).
//
// House pattern (Accelerated Experiences, LLC): Vercel Node serverless (ESM), env-gated,
// dependency-free (raw fetch to Upstash/Vercel KV REST) — same shape as api/books.mjs and
// api/connect.mjs. Stores documents Barry writes in barry-docs.html: title + rich-text HTML
// body, versioned by updatedAt. This is the real save/load path — the editor also always
// offers a real local download (.doc, opens in Word & Google Docs) that works even before
// KV is configured, so writing never depends on the backend being live.
//
// DEGRADES GRACEFULLY: if no KV env is set it returns 200 { ok:false, reason:'no_kv' } so the
// UI can fall back to "download only" instead of erroring.

const NS = 'bb:docs:';
const LIST_KEY = NS + 'list';

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
const delKey = (k) => kv(['DEL', k]);

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
const newId = () => 'doc-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

async function list() {
  const idx = await getJSON(LIST_KEY, []);
  idx.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return { ok: true, docs: idx };
}
async function get(p) {
  const id = clip(p.id, 60);
  if (!id) return { ok: false, reason: 'bad_args' };
  const doc = await getJSON(NS + 'doc:' + id, null);
  if (!doc) return { ok: false, reason: 'not_found' };
  return { ok: true, doc };
}
async function save(p) {
  const title = clip(p.title, 200) || 'Untitled document';
  const html = clip(p.html, 200000); // ~200KB ceiling, plenty for a practice document
  let id = clip(p.id, 60);
  const now = Date.now();
  if (!id) id = newId();
  const doc = { id, title, html, updatedAt: now, author: clip(p.author, 80) || 'Barry Burris, NMD' };
  await setJSON(NS + 'doc:' + id, doc);
  const idx = await getJSON(LIST_KEY, []);
  const i = idx.findIndex((d) => d.id === id);
  const preview = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140);
  const entry = { id, title, updatedAt: now, preview };
  if (i >= 0) idx[i] = entry; else idx.push(entry);
  await setJSON(LIST_KEY, idx);
  return { ok: true, id, updatedAt: now };
}
async function del(p) {
  const id = clip(p.id, 60);
  if (!id) return { ok: false, reason: 'bad_args' };
  await delKey(NS + 'doc:' + id);
  const idx = await getJSON(LIST_KEY, []);
  await setJSON(LIST_KEY, idx.filter((d) => d.id !== id));
  return { ok: true };
}

const ACT = { list, get, save, del, ping: async () => ({ ok: true, ts: Date.now() }) };

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

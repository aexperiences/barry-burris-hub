// /api/dispensary — Barry Burris, NMD · supplement dispensary (the #1 NMD revenue line).
//
// Barry curates a catalog, recommends a per-patient PROTOCOL, the patient orders, pays through
// the payment engine (/api/pay → Stripe), and Barry fulfills. House pattern (Accelerated
// Experiences, LLC): Vercel Node serverless (ESM), env-gated, dependency-free (raw fetch to the
// same Upstash KV as Connect). No inventory to stock — Barry sets retail (his margin baked in);
// a Fullscript link-out can ride alongside later.
//
// Actions:
//   products / saveProduct / delProduct        — provider curates the catalog
//   protocolGet / protocolSet                   — provider recommends a patient's regimen; patient reads it
//   order                                        — patient places an order (returns it; pay via /api/pay)
//   orders / patientOrders / orderStatus / markPaid — fulfillment + payment reconciliation
//
// DEGRADES GRACEFULLY: no KV env → 200 { ok:false, reason:'no_kv' }. Keys from env only.

const NS = 'bb:disp:';
const TTL = 15552000;      // 180 days
const LIST_MAX = 300;

function kvCreds() {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
  const tok = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
  return url && tok ? { url, tok } : null;
}
async function kv(cmd) {
  const c = kvCreds(); if (!c) throw new Error('no_kv');
  const r = await fetch(c.url, { method: 'POST', headers: { authorization: 'Bearer ' + c.tok, 'content-type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json().catch(() => null);
  if (!r.ok) { const e = new Error((j && j.error) || ('kv ' + r.status)); e.status = r.status; throw e; }
  return j ? j.result : null;
}
const getJSON = async (k, d) => { try { const v = await kv(['GET', k]); return v == null ? d : JSON.parse(v); } catch { return d; } };
const setJSON = (k, v, ex) => kv(ex ? ['SET', k, JSON.stringify(v), 'EX', String(ex)] : ['SET', k, JSON.stringify(v)]);

function cors(res) { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'content-type'); }
function json(res, code, obj) { res.statusCode = code; res.setHeader('content-type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)); }
async function readBody(req) {
  if (req.body != null) { if (typeof req.body === 'object') return req.body; if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } } }
  const chunks = []; try { for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c); } catch { return {}; }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}
const clip = (s, n) => String(s == null ? '' : s).slice(0, n);
const slug = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 80);
const rid = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
const cents = (v) => Math.max(0, Math.round(Number(v) || 0));

// ---------- catalog ----------
function cleanProduct(p) {
  return { id: clip(p.id, 40) || rid(), name: clip(p.name, 120), brand: clip(p.brand, 80), cat: clip(p.cat, 60), desc: clip(p.desc, 600), price: cents(p.price), active: p.active !== false };
}
async function products() { return { ok: true, products: await getJSON(NS + 'catalog', []) }; }
async function saveProduct(p) {
  if (!clip(p.name, 120)) return { ok: false, reason: 'no_name' };
  const list = await getJSON(NS + 'catalog', []);
  const prod = cleanProduct(p);
  const i = list.findIndex((x) => x.id === prod.id);
  if (i >= 0) list[i] = prod; else list.push(prod);
  await setJSON(NS + 'catalog', list);
  return { ok: true, product: prod, products: list };
}
async function delProduct(p) {
  const id = clip(p.id, 40); if (!id) return { ok: false, reason: 'bad_args' };
  let list = await getJSON(NS + 'catalog', []);
  list = list.filter((x) => x.id !== id);
  await setJSON(NS + 'catalog', list);
  return { ok: true, products: list };
}

// ---------- per-patient protocol ----------
function patientKeyOf(p) { return slug(p.patientKey || p.with || (p.role === 'patient' ? (p.me || p.from) : (p.to || p.patient))); }
async function protocolGet(p) {
  const pk = patientKeyOf(p); if (!pk) return { ok: false, reason: 'bad_args' };
  return { ok: true, patientKey: pk, protocol: await getJSON(NS + 'pr:' + pk, { items: [], note: '', updatedTs: 0 }) };
}
async function protocolSet(p) {
  const pk = patientKeyOf(p); if (!pk) return { ok: false, reason: 'bad_args' };
  const items = Array.isArray(p.items) ? p.items.slice(0, 40).map((it) => ({ productId: clip(it.productId, 40), dose: clip(it.dose, 120), note: clip(it.note, 240) })) : [];
  const protocol = { items: items, note: clip(p.note, 1000), updatedTs: Date.now() };
  await setJSON(NS + 'pr:' + pk, protocol, TTL);
  return { ok: true, patientKey: pk, protocol };
}

// ---------- orders ----------
async function order(p) {
  const pk = patientKeyOf(p); if (!pk) return { ok: false, reason: 'bad_args' };
  const items = Array.isArray(p.items) ? p.items.slice(0, 50).map((it) => ({ id: clip(it.id, 40), name: clip(it.name, 120), price: cents(it.price), qty: Math.max(1, Math.min(99, parseInt(it.qty, 10) || 1)) })) : [];
  if (!items.length) return { ok: false, reason: 'empty' };
  const total = items.reduce((s, it) => s + it.price * it.qty, 0);
  const o = { id: rid(), patientKey: pk, patientName: clip(p.patientName || p.name, 120) || pk, items, total, status: 'new', paid: false, ts: Date.now() };
  await setJSON(NS + 'o:' + o.id, o, TTL);
  try { await kv(['LPUSH', NS + 'pl:' + pk, o.id]); await kv(['LTRIM', NS + 'pl:' + pk, '0', String(LIST_MAX - 1)]); } catch (e) { if (String(e.message) === 'no_kv') throw e; }
  try { await kv(['LPUSH', NS + 'all', o.id]); await kv(['LTRIM', NS + 'all', '0', String(LIST_MAX - 1)]); } catch (e) { if (String(e.message) === 'no_kv') throw e; }
  return { ok: true, order: o };
}
async function idsToOrders(ids) {
  if (!ids || !ids.length) return [];
  const keys = ids.map((id) => NS + 'o:' + id);
  let raw = [];
  try { raw = await kv(['MGET'].concat(keys)) || []; } catch { raw = []; }
  return raw.map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
}
async function orders() {
  let ids = []; try { ids = await kv(['LRANGE', NS + 'all', '0', '100']) || []; } catch (e) { if (String(e.message) === 'no_kv') throw e; }
  return { ok: true, orders: await idsToOrders(ids) };
}
async function patientOrders(p) {
  const pk = patientKeyOf(p); if (!pk) return { ok: false, reason: 'bad_args' };
  let ids = []; try { ids = await kv(['LRANGE', NS + 'pl:' + pk, '0', '100']) || []; } catch (e) { if (String(e.message) === 'no_kv') throw e; }
  return { ok: true, patientKey: pk, orders: await idsToOrders(ids) };
}
async function orderStatus(p) {
  const id = clip(p.id, 40); if (!id) return { ok: false, reason: 'bad_args' };
  const o = await getJSON(NS + 'o:' + id, null); if (!o) return { ok: false, reason: 'not_found' };
  const st = ['new', 'paid', 'fulfilling', 'shipped', 'done', 'canceled'];
  if (st.indexOf(p.status) >= 0) o.status = p.status;
  await setJSON(NS + 'o:' + id, o, TTL);
  return { ok: true, order: o };
}
async function markPaid(p) {
  const id = clip(p.id, 40); if (!id) return { ok: false, reason: 'bad_args' };
  const o = await getJSON(NS + 'o:' + id, null); if (!o) return { ok: false, reason: 'not_found' };
  if (!o.paid) { o.paid = true; o.paidTs = Date.now(); if (o.status === 'new') o.status = 'paid'; await setJSON(NS + 'o:' + id, o, TTL); }
  return { ok: true, order: o };
}

const ACT = { products, saveProduct, delProduct, protocolGet, protocolSet, order, orders, patientOrders, orderStatus, markPaid, ping: async () => ({ ok: true, ts: Date.now() }) };

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (!kvCreds()) return json(res, 200, { ok: false, reason: 'no_kv' });
  let body = {};
  if (req.method === 'POST') { try { body = await readBody(req); } catch { body = {}; } }
  const url = new URL(req.url, 'http://x');
  const doName = body.do || url.searchParams.get('do') || '';
  const fn = ACT[doName];
  if (!fn) return json(res, 400, { ok: false, reason: 'bad_action', message: 'unknown action: ' + doName });
  try { return json(res, 200, await fn(Object.assign({}, Object.fromEntries(url.searchParams), body))); }
  catch (e) { if (String(e && e.message) === 'no_kv') return json(res, 200, { ok: false, reason: 'no_kv' }); return json(res, 200, { ok: false, reason: 'error', message: clip(e && e.message, 200) }); }
}

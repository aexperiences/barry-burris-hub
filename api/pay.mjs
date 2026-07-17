// /api/pay — Barry Burris, NMD · the payment primitive (Stripe, one-time checkout).
//
// The reusable "take a payment" call the whole money layer rides on — invoices, the
// supplement dispensary, visit fees, packages. House pattern (Accelerated Experiences, LLC):
// Vercel Node serverless (ESM), env-gated, dependency-free (raw fetch to Stripe's REST API,
// exactly like the proven espofret checkout). Optional KV persists the order so status
// survives a page reload (same Upstash KV as Connect); payments still work without it.
//
// Actions:
//   checkout — create a one-time Stripe Checkout Session from an amount + description → { url, id }
//   verify   — confirm a returned session is paid → { paid } (and mark the KV order paid)
//
// DEGRADES GRACEFULLY: no STRIPE_SECRET_KEY → 200 { ok:false, reason:'no_key' } so the UI shows
// "payments turn on once Stripe is connected". No key is ever hardcoded.
//   STRIPE_SECRET_KEY  (required)         PAY_SITE  (optional, defaults to the hub origin)
//   KV_REST_API_URL + KV_REST_API_TOKEN   (optional — persists orders)

const STRIPE = 'https://api.stripe.com/v1';
const NS = 'bb:pay:';
const DEFAULT_SITE = 'https://barry-burris-hub.vercel.app';
const ORDER_TTL = 7776000; // 90 days

function kvCreds() {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
  const tok = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
  return url && tok ? { url, tok } : null;
}
async function kv(cmd) {
  const c = kvCreds(); if (!c) return null;
  try {
    const r = await fetch(c.url, { method: 'POST', headers: { authorization: 'Bearer ' + c.tok, 'content-type': 'application/json' }, body: JSON.stringify(cmd) });
    const j = await r.json().catch(() => null); return j ? j.result : null;
  } catch { return null; }
}
const setOrder = (id, o) => kv(['SET', NS + id, JSON.stringify(o), 'EX', String(ORDER_TTL)]);
const getOrder = async (id) => { const v = await kv(['GET', NS + id]); try { return v == null ? null : JSON.parse(v); } catch { return null; } };

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
}
function json(res, code, obj) { res.statusCode = code; res.setHeader('content-type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)); }
async function readBody(req) {
  if (req.body != null) { if (typeof req.body === 'object') return req.body; if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } } }
  const chunks = []; try { for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c); } catch { return {}; }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}
const clip = (s, n) => String(s == null ? '' : s).slice(0, n);
const rid = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);

// Only allow same-site relative return paths (no open redirect).
function safePath(p, fallback) {
  const s = String(p || '');
  return /^\/[A-Za-z0-9._~\-\/#?=&]*$/.test(s) ? s : fallback;
}
async function stripe(key, path, form) {
  const opt = { headers: { authorization: 'Bearer ' + key } };
  if (form) { opt.method = 'POST'; opt.headers['content-type'] = 'application/x-www-form-urlencoded'; opt.body = form.toString(); }
  const r = await fetch(STRIPE + path, opt);
  const j = await r.json().catch(() => null);
  return { ok: r.ok, status: r.status, data: j };
}

async function checkout(key, p) {
  const amount = Math.round(Number(p.amount)); // cents
  if (!amount || amount < 50) return { ok: false, reason: 'bad_amount', message: 'Amount must be at least $0.50.' };
  const currency = (clip(p.currency, 4) || 'usd').toLowerCase();
  const description = clip(p.description, 300) || 'Payment to Barry Burris, NMD';
  const site = (process.env.PAY_SITE || DEFAULT_SITE).replace(/\/$/, '');
  const ret = safePath(p.returnPath, '/barry-burris-hub.html#billing');
  const id = clip(p.orderId, 60) || rid();

  const form = new URLSearchParams();
  form.set('mode', 'payment');
  form.set('line_items[0][price_data][currency]', currency);
  form.set('line_items[0][price_data][unit_amount]', String(amount));
  form.set('line_items[0][price_data][product_data][name]', description);
  form.set('line_items[0][quantity]', '1');
  form.set('success_url', site + ret + (ret.indexOf('?') >= 0 ? '&' : '?') + 'paid={CHECKOUT_SESSION_ID}');
  form.set('cancel_url', site + ret + (ret.indexOf('?') >= 0 ? '&' : '?') + 'payx=1');
  form.set('billing_address_collection', 'auto');
  if (p.email) form.set('customer_email', clip(p.email, 200));
  form.set('metadata[order_id]', id);
  if (p.patientName) form.set('metadata[patient]', clip(p.patientName, 120));
  if (p.kind) form.set('metadata[kind]', clip(p.kind, 40));

  const r = await stripe(key, '/checkout/sessions', form);
  if (!r.ok) return { ok: false, reason: 'stripe', message: (r.data && r.data.error && r.data.error.message) || ('Stripe ' + r.status) };
  await setOrder(id, { id, amount, currency, description, patient: clip(p.patientName, 120), kind: clip(p.kind, 40), status: 'pending', session: r.data.id, ts: Date.now() });
  return { ok: true, id, url: r.data.url };
}

async function verify(key, p) {
  const sid = clip(p.session_id || p.session, 200);
  if (!sid) return { ok: false, reason: 'bad_args' };
  const r = await stripe(key, '/checkout/sessions/' + encodeURIComponent(sid), null);
  if (!r.ok) return { ok: false, reason: 'stripe', message: (r.data && r.data.error && r.data.error.message) || ('Stripe ' + r.status) };
  const paid = r.data.payment_status === 'paid';
  const oid = r.data.metadata && r.data.metadata.order_id;
  if (paid && oid) { const o = await getOrder(oid); if (o && o.status !== 'paid') { o.status = 'paid'; o.paidTs = Date.now(); await setOrder(oid, o); } }
  return { ok: true, paid, orderId: oid || null, amount: r.data.amount_total, currency: r.data.currency };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  const key = (process.env.STRIPE_SECRET_KEY || '').trim();
  if (!key) return json(res, 200, { ok: false, reason: 'no_key' });

  let body = {};
  if (req.method === 'POST') { try { body = await readBody(req); } catch { body = {}; } }
  const url = new URL(req.url, 'http://x');
  const doName = body.do || url.searchParams.get('do') || '';
  const args = Object.assign({}, Object.fromEntries(url.searchParams), body);
  try {
    if (doName === 'checkout') return json(res, 200, await checkout(key, args));
    if (doName === 'verify') return json(res, 200, await verify(key, args));
    if (doName === 'ping') return json(res, 200, { ok: true, ts: Date.now() });
    return json(res, 400, { ok: false, reason: 'bad_action', message: 'unknown action: ' + doName });
  } catch (e) {
    return json(res, 200, { ok: false, reason: 'error', message: clip(e && e.message, 200) });
  }
}

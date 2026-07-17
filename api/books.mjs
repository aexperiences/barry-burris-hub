// /api/books — Barry Burris, NMD · the ONE money spine (QuickBooks-grade, for a for-profit
// medical / naturopathic practice). Tracks every dollar in and out and produces real reports:
//   • Profit & Loss (cash basis): income by source → COGS → gross profit → operating expenses → net
//   • Idaho SALES TAX (6%) — collected only on TAXABLE sales (supplements/retail), held as a
//     LIABILITY owed to the state, never counted as income. Professional services are NOT taxed.
//   • Accounts Receivable — money owed to the practice (unpaid supplement orders + manual invoices).
//   • A simple Balance snapshot (cash-basis): cash position, A/R, sales-tax payable.
// It also folds in the DISPENSARY automatically (paid orders = supplement income; unpaid = A/R),
// so the books and the store are one truth. This spine REPORTS; it never moves money.
//
// House pattern (Accelerated Experiences, LLC): env-gated, dependency-free (raw fetch to the same
// Upstash KV as Connect). Not tax advice — confirm with a CPA. No key hardcoded.

const NS = 'bb:books:';
const LEDGER = NS + 'ledger';
const CFG = NS + 'cfg';
const CAP = 5000;
const ID_TAX = 0.06; // Idaho state sales tax (2026)

// Card processing fees, stated net (never hidden).
const FEES = { stripe: { pct: 0.029, flat: 0.30 }, square: { pct: 0.026, flat: 0.10 }, cash: { pct: 0, flat: 0 }, check: { pct: 0, flat: 0 }, none: { pct: 0, flat: 0 } };

// Income streams a naturopathic / functional practice actually uses. Only tangible goods
// (supplements/retail) are taxable in Idaho; professional services are not.
const INCOME = {
  visit:      { label: 'Patient visits & consults', taxable: false },
  telehealth: { label: 'Telehealth visits',         taxable: false },
  labs:       { label: 'Lab services',              taxable: false },
  supplement: { label: 'Supplement sales',          taxable: true  },
  membership: { label: 'Memberships',               taxable: false },
  procedure:  { label: 'In-office procedures / IV', taxable: false },
  other:      { label: 'Other income',              taxable: false }
};
// Expense buckets. COGS = the cost of goods sold (supplements + outside labs); the rest is opex.
const EXPENSE = {
  cogs:        { label: 'Product cost (COGS)',   cogs: true },
  labcost:     { label: 'Outside lab costs',     cogs: true },
  rent:        { label: 'Rent / facility',       cogs: false },
  payroll:     { label: 'Payroll & contractors', cogs: false },
  malpractice: { label: 'Malpractice / liability', cogs: false },
  software:    { label: 'Software & subscriptions', cogs: false },
  merchantfee: { label: 'Merchant / card fees',  cogs: false },
  marketing:   { label: 'Marketing',             cogs: false },
  cme:         { label: 'CE / licensing / dues', cogs: false },
  insurance:   { label: 'Business insurance',    cogs: false },
  utilities:   { label: 'Utilities & office',    cogs: false },
  supplies:    { label: 'Clinical supplies',     cogs: false },
  taxremit:    { label: 'Sales tax paid to Idaho', cogs: false },
  other:       { label: 'Other expense',         cogs: false }
};

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
const setJSON = (k, v) => kv(['SET', k, JSON.stringify(v)]);

function cors(res) { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'content-type'); }
function json(res, code, obj) { res.statusCode = code; res.setHeader('content-type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)); }
async function readBody(req) {
  if (req.body != null) { if (typeof req.body === 'object') return req.body; if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } } }
  const chunks = []; try { for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c); } catch { return {}; }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const nNum = (v, d) => { const x = parseFloat(v); return Number.isFinite(x) ? x : d; };
const clip = (s, n) => String(s == null ? '' : s).replace(/[<>]/g, '').slice(0, n);
const rid = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
function feeOf(gross, proc) { const f = FEES[proc] || FEES.none; return r2(gross * f.pct + (gross > 0 ? f.flat : 0)); }

// Sanitize + compute one money event (never trust the client).
function cleanEvent(e) {
  e = e || {};
  const out = e.dir === 'out' || e.category != null && EXPENSE[e.category] || e.source === 'expense';
  const dir = out ? 'out' : 'in';
  const proc = FEES[e.processor] ? e.processor : 'none';
  const gross = Math.max(0, r2(nNum(e.gross, 0)));
  let source = 'other', category = null, meta = { taxable: false };
  if (dir === 'in') { source = INCOME[e.source] ? e.source : 'other'; meta = INCOME[source]; }
  else { category = EXPENSE[e.category] ? e.category : 'other'; }
  const taxable = dir === 'in' && (e.taxable != null ? (e.taxable === true || e.taxable === 'true') : !!meta.taxable);
  const tax = taxable ? r2(gross - gross / (1 + ID_TAX)) : 0;   // tax-inclusive carve-out
  const fee = dir === 'in' ? feeOf(gross, proc) : 0;
  const net = dir === 'in' ? r2(gross - tax - fee) : r2(gross);
  return {
    id: rid(), ts: Number.isFinite(+e.ts) && +e.ts > 0 ? +e.ts : Date.now(),
    dir, source: dir === 'in' ? source : (category === 'taxremit' ? 'taxremit' : 'expense'),
    category, gross, tax, fee, net, processor: proc, taxable,
    patient: clip(e.patient || e.patientName, 90), ref: clip(e.ref, 90), note: clip(e.note, 200)
  };
}

const acc = () => ({ gross: 0, tax: 0, fee: 0, net: 0, n: 0 });
function add(a, e) { a.gross += e.gross; a.tax += e.tax; a.fee += e.fee; a.net += e.net; a.n++; return a; }

// Fold the dispensary in: paid orders → supplement income; unpaid → A/R.
async function dispensaryRollup() {
  let ids = []; try { ids = await kv(['LRANGE', 'bb:disp:all', '0', '400']) || []; } catch { ids = []; }
  if (!ids.length) return { paidTotal: 0, arTotal: 0, paidCount: 0, arCount: 0, tax: 0, fee: 0 };
  const keys = ids.map((id) => 'bb:disp:o:' + id);
  let raw = []; try { raw = await kv(['MGET'].concat(keys)) || []; } catch { raw = []; }
  const orders = raw.map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
  let paidTotal = 0, arTotal = 0, paidCount = 0, arCount = 0, tax = 0, fee = 0;
  orders.forEach((o) => {
    if (o.paid) { paidTotal += o.total; paidCount++; tax += r2(o.total - o.total / (1 + ID_TAX)); fee += feeOf(o.total, 'stripe'); }
    else { arTotal += o.total; arCount++; }
  });
  return { paidTotal: r2(paidTotal), arTotal: r2(arTotal), paidCount, arCount, tax: r2(tax), fee: r2(fee) };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (!kvCreds()) return json(res, 200, { ok: false, configured: false, reason: 'no_kv' });

  // ---- POST: append an event, void one, or set config ----
  if (req.method === 'POST') {
    let body; try { body = await readBody(req); } catch { body = {}; }
    if (body.setCfg) { try { await setJSON(CFG, body.setCfg); } catch {} return json(res, 200, { ok: true, cfg: body.setCfg }); }
    if (body.void) {
      let arr = await getJSON(LEDGER, []); if (!Array.isArray(arr)) arr = [];
      const before = arr.length; arr = arr.filter((e) => e.id !== body.void);
      try { await setJSON(LEDGER, arr); } catch {}
      return json(res, 200, { ok: true, removed: before - arr.length });
    }
    const ev = cleanEvent(body);
    if (ev.gross <= 0) return json(res, 200, { ok: false, reason: 'zero_amount' });
    let arr = await getJSON(LEDGER, []); if (!Array.isArray(arr)) arr = [];
    arr.push(ev); if (arr.length > CAP) arr = arr.slice(arr.length - CAP);
    try { await setJSON(LEDGER, arr); } catch (e) { return json(res, 200, { ok: false, reason: 'error', message: clip(e && e.message, 120) }); }
    return json(res, 200, { ok: true, event: ev });
  }

  // ---- GET: roll everything up into reports ----
  let events = await getJSON(LEDGER, []); if (!Array.isArray(events)) events = [];
  const cfg = await getJSON(CFG, null);
  let disp; try { disp = await dispensaryRollup(); } catch { disp = { paidTotal: 0, arTotal: 0, paidCount: 0, arCount: 0, tax: 0, fee: 0 }; }

  const inBySrc = {}; Object.keys(INCOME).forEach((k) => (inBySrc[k] = acc()));
  const exByCat = {}; Object.keys(EXPENSE).forEach((k) => (exByCat[k] = acc()));
  let taxRemitted = 0;
  events.forEach((e) => {
    if (e.dir === 'in') { if (inBySrc[e.source]) add(inBySrc[e.source], e); }
    else { if (e.category === 'taxremit') taxRemitted += e.net; else if (exByCat[e.category]) add(exByCat[e.category], e); }
  });
  // fold dispensary paid orders into supplement income (net of tax + card fee)
  const dispNet = r2(disp.paidTotal - disp.tax - disp.fee);
  inBySrc.supplement.net = r2(inBySrc.supplement.net + dispNet);
  inBySrc.supplement.gross = r2(inBySrc.supplement.gross + disp.paidTotal);
  inBySrc.supplement.tax = r2(inBySrc.supplement.tax + disp.tax);
  inBySrc.supplement.fee = r2(inBySrc.supplement.fee + disp.fee);
  inBySrc.supplement.n += disp.paidCount;

  const income = {}; let totalIncome = 0, taxCollected = 0, feesTotal = 0;
  Object.keys(INCOME).forEach((k) => {
    const a = inBySrc[k];
    income[k] = { key: k, label: INCOME[k].label, net: r2(a.net), gross: r2(a.gross), tax: r2(a.tax), fee: r2(a.fee), taxable: !!INCOME[k].taxable, n: a.n };
    totalIncome += a.net; taxCollected += a.tax; feesTotal += a.fee;
  });
  totalIncome = r2(totalIncome); taxCollected = r2(taxCollected); feesTotal = r2(feesTotal);

  const expenses = {}; let cogs = 0, opex = 0;
  Object.keys(EXPENSE).forEach((k) => {
    if (k === 'taxremit') return;
    const a = exByCat[k];
    expenses[k] = { key: k, label: EXPENSE[k].label, net: r2(a.net), n: a.n, cogs: !!EXPENSE[k].cogs };
    if (EXPENSE[k].cogs) cogs += a.net; else opex += a.net;
  });
  cogs = r2(cogs); opex = r2(opex);
  const grossProfit = r2(totalIncome - cogs);
  const netIncome = r2(grossProfit - opex);
  const salesTaxOwed = r2(taxCollected - taxRemitted);

  const recent = events.slice(-18).reverse();

  return json(res, 200, {
    ok: true, configured: true, currency: 'usd', generatedAt: new Date().toISOString(),
    org: (cfg && cfg.org) || { name: 'Barry Burris, NMD', entity: 'Naturopathic Medicine & Longevity', basis: 'Cash basis' },
    pnl: {
      income, totalIncome,
      cogs, grossProfit,
      expenses, totalOpex: opex,
      netIncome
    },
    salesTax: { rate: ID_TAX, collected: taxCollected, remitted: r2(taxRemitted), owed: salesTaxOwed,
      note: 'Idaho charges 6% on supplements/retail only — held for the state, never your income. Services are not taxed.' },
    ar: { total: disp.arTotal, count: disp.arCount, note: 'Unpaid supplement orders. Add manual invoices as they arise.' },
    balance: { cashBasisNet: netIncome, receivable: disp.arTotal, salesTaxPayable: salesTaxOwed, cardFees: feesTotal,
      note: 'Cash-basis snapshot. A full balance sheet with assets/equity comes when you connect a bank feed.' },
    counts: { events: events.length, incomeEvents: Object.values(inBySrc).reduce((n, a) => n + a.n, 0), expenseEvents: Object.values(exByCat).reduce((n, a) => n + a.n, 0), dispensaryPaid: disp.paidCount },
    recent,
    honesty: 'Every figure is tagged. Sales tax is held as owed-to-Idaho, card fees are already removed, and the dispensary folds in automatically. Cash basis — not tax advice; confirm with a CPA.'
  });
}

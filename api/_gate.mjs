// api/_gate.mjs — Barry Burris, NMD · the server-side staff gate.
//
// Why this exists (Oct 17 2026, hub project a4e94ee2): until today no /api route checked
// who was asking, so anyone on the internet could read the practice's contacts and books.
// This file is the one place that decides "is this a signed-in staff member?".
//
// Rule: every STAFF action requires a session. PATIENT-facing actions (a patient's own
// check-ins, orders, messages, video visit, pay, translate) stay open so the patient side
// keeps working. Fail closed: no KV, no session store, bad token -> 401.
//
// Session: header `x-bb-session: <token>` -> KV key `bb:sess:<sha256(token)>` (30-day expiry).
// Underscore file = not a route on Vercel; handlers import it.

import crypto from 'node:crypto';

export const SESSION_TTL = 60 * 60 * 24 * 30; // 30 days
export const SESS_NS = 'bb:sess:';

export function kvCreds() {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
  const tok = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
  return url && tok ? { url, tok } : null;
}

export async function kv(cmd) {
  const c = kvCreds();
  if (!c) throw new Error('no_kv');
  const r = await fetch(c.url, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + c.tok, 'content-type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error('kv_error');
  return j.result;
}

export const hashToken = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');

function tokenOf(req) {
  const h = req.headers || {};
  const t = h['x-bb-session'] || h['X-BB-Session'] || '';
  return typeof t === 'string' && /^[A-Za-z0-9_-]{32,128}$/.test(t) ? t : '';
}

// Returns the staff session object, or null.
export async function staffSession(req) {
  const t = tokenOf(req);
  if (!t || !kvCreds()) return null;
  try {
    const v = await kv(['GET', SESS_NS + hashToken(t)]);
    if (!v) return null;
    const s = JSON.parse(v);
    return s && s.email ? s : null;
  } catch { return null; }
}

// CORS for every route: allow our session header. Same-origin pages are the real callers.
export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-bb-session');
}

function deny(res) {
  res.statusCode = 401;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify({ ok: false, reason: 'signin', message: 'Staff sign-in required.' }));
}

// Use at the top of a handler, after OPTIONS. Returns true if the caller may proceed.
// `isStaffAction` decides whether THIS request needs a session; omit it to gate everything.
export async function gate(req, res, isStaffAction) {
  let needs = true;
  if (typeof isStaffAction === 'function') {
    try { needs = !!(await isStaffAction()); } catch { needs = true; }
  }
  if (!needs) return true;
  const s = await staffSession(req);
  if (s) { req.bbStaff = s; return true; }
  deny(res);
  return false;
}

// Reads the request body once and caches it so the handler can read it again.
export async function peekBody(req) {
  if (req.__bbBody !== undefined) return req.__bbBody;
  let b = {};
  if (req.method === 'POST') {
    if (req.body != null) {
      if (typeof req.body === 'object') b = req.body;
      else if (typeof req.body === 'string') { try { b = JSON.parse(req.body); } catch { b = {}; } }
    } else {
      const chunks = [];
      try { for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c); } catch {}
      try { b = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { b = {}; }
      req.body = b; // so the handler's readBody sees it
    }
  }
  req.__bbBody = b || {};
  return req.__bbBody;
}

// The action name + merged args, the way every handler computes them.
export async function actionOf(req, defaultGet) {
  const body = await peekBody(req);
  const url = new URL(req.url, 'http://x');
  const q = Object.fromEntries(url.searchParams);
  const name = body.do || body.action || q.do || (req.method === 'GET' ? (defaultGet || '') : '');
  return { name, args: Object.assign({}, q, body) };
}

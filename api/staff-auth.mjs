// /api/staff-auth — Barry Burris, NMD · staff sign-in (server-side, the real lock).
//
// Actions (POST {do, ...}):
//   status          -> { ok, setup: bool (an owner exists), signedIn, me }
//   setup           -> first owner only. Needs the one-time setup code Anthony puts in the
//                      Vercel env var BB_SETUP_CODE. Refused once an owner exists.
//   login           -> { email, password } -> { token, me }
//   logout          -> ends this session
//   me              -> who is signed in
//   addStaff        -> owner only: { email, password, name, role }
//   removeStaff     -> owner only: { email }
//   staff           -> owner only: list staff (no password data)
//   changePassword  -> signed in: { password, newPassword }
//
// Passwords: PBKDF2-SHA256, 210,000 rounds, 16-byte salt. Tokens: 32 random bytes; only the
// SHA-256 of a token is stored (bb:sess:<hash>, 30-day expiry).

import crypto from 'node:crypto';
import { kv, kvCreds, cors, staffSession, hashToken, SESS_NS, SESSION_TTL, peekBody } from './_gate.mjs';

const USERS = 'bb:staff:users';           // JSON { [email]: { email, name, role, salt, hash, iter, createdAt } }
const ROUNDS = 210000;
const ROLES = ['owner', 'provider', 'frontdesk', 'assistant'];

function json(res, code, obj) {
  res.statusCode = code;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(obj));
}
const clip = (s, n) => String(s == null ? '' : s).slice(0, n);
const normEmail = (e) => clip(e, 200).trim().toLowerCase();
const okEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const pub = (u) => u && ({ email: u.email, name: u.name, role: u.role });

async function getUsers() {
  const v = await kv(['GET', USERS]);
  try { return v ? JSON.parse(v) : {}; } catch { return {}; }
}
const saveUsers = (u) => kv(['SET', USERS, JSON.stringify(u)]);

function pbkdf2(pw, salt, iter) {
  return new Promise((ok, no) => crypto.pbkdf2(String(pw), Buffer.from(salt, 'hex'), iter, 32, 'sha256', (e, k) => e ? no(e) : ok(k.toString('hex'))));
}
async function makeHash(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return { salt, iter: ROUNDS, hash: await pbkdf2(pw, salt, ROUNDS) };
}
async function checkPw(u, pw) {
  if (!u || !u.salt) { await pbkdf2(pw, '00'.repeat(16), ROUNDS); return false; } // even timing
  const h = await pbkdf2(pw, u.salt, u.iter || ROUNDS);
  const a = Buffer.from(h, 'hex'), b = Buffer.from(u.hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function safeEq(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}
const pwOk = (pw) => typeof pw === 'string' && pw.length >= 10 && pw.length <= 200;

async function newSession(u) {
  const token = crypto.randomBytes(32).toString('base64url');
  await kv(['SET', SESS_NS + hashToken(token), JSON.stringify({ email: u.email, name: u.name, role: u.role, ts: Date.now() }), 'EX', String(SESSION_TTL)]);
  return token;
}

// 10 tries per email per 15 minutes, and 30 per caller address.
async function throttle(key) {
  const k = 'bb:staff:try:' + key;
  const n = await kv(['INCR', k]);
  if (n === 1) await kv(['EXPIRE', k, '900']);
  return n;
}
function ipOf(req) {
  const h = req.headers || {};
  return clip(String(h['x-forwarded-for'] || h['x-real-ip'] || '').split(',')[0].trim(), 64) || 'x';
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') return json(res, 405, { ok: false, reason: 'method' });
  if (!kvCreds()) return json(res, 503, { ok: false, reason: 'no_kv' });

  const b = await peekBody(req);
  const act = clip(b.do || b.action, 32);
  try {
    const me = await staffSession(req);

    if (act === 'status' || act === 'me') {
      const users = await getUsers();
      const setup = Object.values(users).some((u) => u.role === 'owner');
      return json(res, 200, { ok: true, setup, setupOpen: !setup && !!(process.env.BB_SETUP_CODE || '').trim(), signedIn: !!me, me: me ? pub(me) : null });
    }

    if (act === 'setup') {
      const code = (process.env.BB_SETUP_CODE || '').trim();
      if (!code) return json(res, 403, { ok: false, reason: 'setup_closed', message: 'Setup is not open.' });
      if ((await throttle('setup:' + ipOf(req))) > 10) return json(res, 429, { ok: false, reason: 'slow_down' });
      const users = await getUsers();
      if (Object.values(users).some((u) => u.role === 'owner')) return json(res, 403, { ok: false, reason: 'setup_done', message: 'The owner account already exists. Sign in instead.' });
      if (!safeEq(clip(b.code, 200).trim(), code)) return json(res, 403, { ok: false, reason: 'bad_code', message: 'That setup code is not right.' });
      const email = normEmail(b.email);
      if (!okEmail(email)) return json(res, 400, { ok: false, reason: 'bad_email', message: 'Enter a real email.' });
      if (!pwOk(b.password)) return json(res, 400, { ok: false, reason: 'weak', message: 'Use at least ten characters.' });
      const u = Object.assign({ email, name: clip(b.name, 80) || 'Barry Burris, NMD', role: 'owner', createdAt: Date.now() }, await makeHash(b.password));
      users[email] = u; await saveUsers(users);
      return json(res, 200, { ok: true, token: await newSession(u), me: pub(u) });
    }

    if (act === 'login') {
      const email = normEmail(b.email);
      if ((await throttle('ip:' + ipOf(req))) > 30 || (await throttle('em:' + email)) > 10) return json(res, 429, { ok: false, reason: 'slow_down', message: 'Too many tries. Wait fifteen minutes.' });
      const users = await getUsers();
      const u = users[email];
      if (!(await checkPw(u, clip(b.password, 200)))) return json(res, 401, { ok: false, reason: 'bad_login', message: 'Email or password is not right.' });
      return json(res, 200, { ok: true, token: await newSession(u), me: pub(u) });
    }

    if (act === 'logout') {
      const t = (req.headers || {})['x-bb-session'];
      if (t) { try { await kv(['DEL', SESS_NS + hashToken(t)]); } catch {} }
      return json(res, 200, { ok: true });
    }

    // ---- everything below needs a signed-in staff member ----
    if (!me) return json(res, 401, { ok: false, reason: 'signin', message: 'Staff sign-in required.' });

    if (act === 'changePassword') {
      const users = await getUsers(); const u = users[me.email];
      if (!(await checkPw(u, clip(b.password, 200)))) return json(res, 401, { ok: false, reason: 'bad_login', message: 'Current password is not right.' });
      if (!pwOk(b.newPassword)) return json(res, 400, { ok: false, reason: 'weak', message: 'Use at least ten characters.' });
      Object.assign(u, await makeHash(b.newPassword)); await saveUsers(users);
      return json(res, 200, { ok: true });
    }

    if (me.role !== 'owner') return json(res, 403, { ok: false, reason: 'owner_only' });

    if (act === 'staff') {
      const users = await getUsers();
      return json(res, 200, { ok: true, staff: Object.values(users).map(pub) });
    }
    if (act === 'addStaff') {
      const email = normEmail(b.email);
      if (!okEmail(email)) return json(res, 400, { ok: false, reason: 'bad_email' });
      if (!pwOk(b.password)) return json(res, 400, { ok: false, reason: 'weak', message: 'Use at least ten characters.' });
      const role = ROLES.includes(b.role) && b.role !== 'owner' ? b.role : 'assistant';
      const users = await getUsers();
      if (users[email]) return json(res, 409, { ok: false, reason: 'exists' });
      users[email] = Object.assign({ email, name: clip(b.name, 80) || email, role, createdAt: Date.now() }, await makeHash(b.password));
      await saveUsers(users);
      return json(res, 200, { ok: true, member: pub(users[email]) });
    }
    if (act === 'removeStaff') {
      const email = normEmail(b.email);
      const users = await getUsers();
      if (!users[email] || users[email].role === 'owner') return json(res, 400, { ok: false, reason: 'cannot' });
      delete users[email]; await saveUsers(users);
      return json(res, 200, { ok: true });
    }

    return json(res, 400, { ok: false, reason: 'bad_action' });
  } catch (e) {
    return json(res, 500, { ok: false, reason: 'error' });
  }
}

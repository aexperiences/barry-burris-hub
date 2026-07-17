// /api/checkins — Barry Burris, NMD · "Check-Ins": async video (+ text) between visits.
//
// The async lane of Barry Connect: a patient records a short video check-in, the provider
// watches and replies whenever — no scheduling, no phone tag. One thread per patient; each
// item is a short VIDEO (chunked base64 in a Redis list) or a TEXT note, from either side.
//
// House pattern (Accelerated Experiences, LLC): Vercel Node serverless (ESM), env-gated,
// dependency-free (raw fetch to Upstash/Vercel KV REST). No new infra — rides the KV that
// Connect already uses. (Upgrade path: move video bytes to Vercel Blob for HD/longer clips.)
//
// COMPLIANCE: check-in videos are PHI. This lane is meant to run for INTERNATIONAL patients
// (HIPAA does not apply); the US path stays gated client-side (BBRegion) until encryption +
// a BAA store are in place. Items carry a 90-day TTL. Never a consumer social surface.
//
// DEGRADES GRACEFULLY: no KV env -> 200 { ok:false, reason:'no_kv' } so the UI shows "coming
// online". Keys from env only: KV_REST_API_URL + KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_*).

const NS = 'bb:ci:';
const THREAD_MAX = 200;             // items kept per patient thread
const CHUNK = 500000;               // base64 chars per KV list element (~500 KB)
const MAX_DATA = 6000000;           // hard cap on a single upload's base64 length (~6 MB)
const VID_TTL = 7776000;            // 90 days
const NOTE_MAX = 2000;

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

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
}
function json(res, code, obj) { res.statusCode = code; res.setHeader('content-type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)); }
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
const rid = () => now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);

function patientKeyOf(p) { return slug(p.patientKey || p.with || (p.role === 'patient' ? (p.me || p.from) : (p.to || p.patient))); }

// -------- post a check-in (video or text) --------
async function put(p) {
  const pk = patientKeyOf(p);
  if (!pk) return { ok: false, reason: 'bad_args' };
  const role = p.role === 'provider' ? 'provider' : 'patient';
  const kind = p.kind === 'text' ? 'text' : 'video';
  const id = rid();
  const meta = {
    id, from: role, kind,
    name: clip(p.name, 80) || (role === 'provider' ? 'Barry Burris, NMD' : 'Patient'),
    lang: clip(p.lang, 12) || (role === 'provider' ? 'en' : ''),
    region: p.region === 'us' ? 'us' : 'intl',
    note: clip(p.note != null ? p.note : p.text, NOTE_MAX),
    ts: now()
  };
  if (kind === 'video') {
    const data = typeof p.data === 'string' ? p.data : '';
    if (!data) return { ok: false, reason: 'no_video' };
    if (data.length > MAX_DATA) return { ok: false, reason: 'too_big', message: 'Clip is too large — keep it short.' };
    meta.mime = clip(p.mime, 60) || 'video/webm';
    meta.dur = Math.max(0, Math.min(600000, parseInt(p.dur, 10) || 0));
    const parts = [];
    for (let i = 0; i < data.length; i += CHUNK) parts.push(data.slice(i, i + CHUNK));
    meta.chunks = parts.length;
    const vk = NS + 'vid:' + id;
    try {
      await kv(['DEL', vk]);
      await kv(['RPUSH', vk].concat(parts));
      await kv(['EXPIRE', vk, String(VID_TTL)]);
    } catch (e) { if (String(e.message) === 'no_kv') throw e; throw e; }
  } else {
    if (!meta.note) return { ok: false, reason: 'empty' };
  }
  const tk = NS + 'thread:' + pk;
  try { await kv(['RPUSH', tk, JSON.stringify(meta)]); await kv(['LTRIM', tk, String(-THREAD_MAX), '-1']); await kv(['EXPIRE', tk, String(VID_TTL)]); }
  catch (e) { if (String(e.message) === 'no_kv') throw e; throw e; }
  // provider inbox index
  const idx = await getJSON(NS + 'index', {});
  const prev = idx[pk] || {};
  idx[pk] = {
    key: pk,
    name: clip(p.patientName || (role === 'patient' ? meta.name : prev.name), 80) || prev.name || pk,
    region: meta.region,
    lastTs: meta.ts, lastFrom: role, lastKind: kind,
    lastNote: kind === 'text' ? meta.note : (meta.note || '🎥 Video check-in')
  };
  await setJSON(NS + 'index', idx);
  return { ok: true, id, ts: meta.ts };
}

// -------- read a patient's thread (metadata only, no video bytes) --------
async function thread(p) {
  const pk = patientKeyOf(p);
  if (!pk) return { ok: false, reason: 'bad_args' };
  let raw = [];
  try { raw = await kv(['LRANGE', NS + 'thread:' + pk, '0', '-1']) || []; } catch (e) { if (String(e.message) === 'no_kv') throw e; }
  const items = raw.map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
  return { ok: true, patientKey: pk, items };
}

// -------- fetch one check-in's video bytes (reassembled base64) --------
async function video(p) {
  const id = clip(p.id, 64);
  if (!id) return { ok: false, reason: 'bad_args' };
  let parts = [];
  try { parts = await kv(['LRANGE', NS + 'vid:' + id, '0', '-1']) || []; } catch (e) { if (String(e.message) === 'no_kv') throw e; }
  if (!parts.length) return { ok: false, reason: 'expired' };
  return { ok: true, id, data: parts.join('') };
}

// -------- provider inbox / patient's own list --------
async function list(p) {
  if (p.role === 'patient') { return thread(p); }
  const idx = await getJSON(NS + 'index', {});
  const threads = Object.values(idx).sort((a, b) => (b.lastTs || 0) - (a.lastTs || 0));
  return { ok: true, threads };
}

// -------- mark a thread seen by this reader (unread badges) --------
async function seen(p) {
  const pk = patientKeyOf(p);
  const role = p.role === 'provider' ? 'provider' : 'patient';
  if (!pk) return { ok: false, reason: 'bad_args' };
  try { await setJSON(NS + 'seen:' + pk + ':' + role, { ts: parseInt(p.ts, 10) || now() }, VID_TTL); } catch (e) { if (String(e.message) === 'no_kv') throw e; }
  return { ok: true };
}
async function seenGet(p) {
  const pk = patientKeyOf(p);
  const role = p.role === 'provider' ? 'provider' : 'patient';
  const s = await getJSON(NS + 'seen:' + pk + ':' + role, { ts: 0 });
  return { ok: true, ts: (s && s.ts) || 0 };
}

const ACT = { put, thread, video, list, inbox: list, seen, seenGet, ping: async () => ({ ok: true, ts: now() }) };

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
  try {
    const args = Object.assign({}, url.searchParams ? Object.fromEntries(url.searchParams) : {}, body);
    return json(res, 200, await fn(args));
  } catch (e) {
    if (String(e && e.message) === 'no_kv') return json(res, 200, { ok: false, reason: 'no_kv' });
    return json(res, 200, { ok: false, reason: 'error', message: clip(e && e.message, 200) });
  }
}

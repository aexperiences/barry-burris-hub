// /api/translate — REAL translation for the Barry Burris, NMD portal.
//
// Barry writes in English; his international (Vietnamese) patients read in their
// language. This translates provider text so they can communicate. Same house
// pattern as /api/draft: Vercel Node serverless (ESM), env-gated, DeepSeek first
// -> Anthropic fallback, dependency-free (raw fetch), NEVER leaks the key.
//
// POST { text | texts:[...], to:'vi'|'en'|<lang>, from?:'auto' }
//   -> 200 { ok:true, text, items:[...], model }        (translated)
//   -> 200 { ok:false, reason:'no_key' }                (no key -> client shows original)
//   -> 200 { ok:false, reason:'error', message }        (upstream error -> client shows original)
//
// Keys come ONLY from Vercel env: DEEPSEEK_API_KEY (preferred) | ANTHROPIC_API_KEY.

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEEPSEEK_MODEL = 'deepseek-chat';
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

const LANGS = { vi: 'Vietnamese', en: 'English', es: 'Spanish', fr: 'French', zh: 'Chinese', ja: 'Japanese', ko: 'Korean', th: 'Thai', km: 'Khmer', tl: 'Tagalog' };

function sys(target) {
  const name = LANGS[target] || target || 'the target language';
  return `You are a professional medical translator for a functional-medicine telehealth practice. Translate each input string into ${name}, faithfully and naturally, preserving clinical meaning, a warm professional tone, names, numbers, and any line breaks. Do NOT add notes, explanations, transliteration, or commentary. If a string is already in ${name}, return it unchanged. Return STRICT JSON of the exact same shape and order: {"items":["<translation 1>","<translation 2>", ...]}.`;
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
}
function json(res, code, obj) {
  res.statusCode = code;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(obj));
}
async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  }
  if (!req.readable) return {};
  const chunks = [];
  try { for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c); } catch { return {}; }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}
const clip = (s, n) => String(s == null ? '' : s).slice(0, n);

async function callDeepseek(key, system, userJson) {
  const r = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL, temperature: 0.2, response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: system }, { role: 'user', content: userJson }],
    }),
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) { const e = new Error((data && data.error && data.error.message) || ('DeepSeek ' + r.status)); e.status = r.status; throw e; }
  const msg = data && data.choices && data.choices[0] && data.choices[0].message;
  return String((msg && msg.content) || '');
}
async function callAnthropic(key, system, userJson) {
  const r = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL, max_tokens: 1500, temperature: 0.2,
      system: system + '\n\nReturn ONLY the raw JSON object — no prose, no code fences.',
      messages: [{ role: 'user', content: userJson }],
    }),
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) { const e = new Error((data && data.error && data.error.message) || ('Anthropic ' + r.status)); e.status = r.status; throw e; }
  const blocks = data && Array.isArray(data.content) ? data.content : [];
  return String(blocks.filter((b) => b && b.type === 'text').map((b) => b.text).join('') || '');
}
function parseModelJson(text) {
  if (!text) return null;
  let t = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try { return JSON.parse(t); } catch {}
  const a = t.indexOf('{'), z = t.lastIndexOf('}');
  if (a >= 0 && z > a) { try { return JSON.parse(t.slice(a, z + 1)); } catch {} }
  return null;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST, OPTIONS'); return json(res, 405, { ok: false, reason: 'method' }); }

  const dsKey = (process.env.DEEPSEEK_API_KEY || '').trim();
  const anKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!dsKey && !anKey) return json(res, 200, { ok: false, reason: 'no_key' });

  let body; try { body = await readBody(req); } catch { body = {}; }
  const to = clip(body.to || 'vi', 12);
  let items = Array.isArray(body.texts) ? body.texts : (body.text != null ? [body.text] : []);
  items = items.slice(0, 40).map((x) => clip(x, 4000));
  if (!items.length) return json(res, 200, { ok: false, reason: 'error', message: 'No text to translate.' });

  const system = sys(to);
  const userJson = JSON.stringify({ items });
  const provider = dsKey ? 'deepseek' : 'anthropic';
  let raw;
  try { raw = dsKey ? await callDeepseek(dsKey, system, userJson) : await callAnthropic(anKey, system, userJson); }
  catch (e) { return json(res, 200, { ok: false, reason: 'error', message: String((e && e.message) || e).slice(0, 300) }); }

  const parsed = parseModelJson(raw);
  const out = parsed && Array.isArray(parsed.items) ? parsed.items.map((x) => String(x == null ? '' : x)) : null;
  if (!out || !out.length) return json(res, 200, { ok: false, reason: 'error', message: 'Could not parse a translation.' });

  return json(res, 200, { ok: true, text: out[0], items: out, model: provider, to });
}

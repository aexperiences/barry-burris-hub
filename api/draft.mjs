// /api/draft — REAL AI drafting of the NARRATIVE-ONLY SOAP sections for Barry Burris, NMD.
//
// House pattern (Accelerated Experiences, LLC): Vercel Node serverless (ESM), env-gated,
// DeepSeek first -> Anthropic fallback. Dependency-free (raw fetch) so it runs in a plain
// static+/api repo with no node_modules.
//
// It drafts ONLY three narrative fields — hpi / ros / consider — for a LICENSED PROVIDER to
// review, edit, and SIGN. It NEVER outputs medications, doses, specific prescriptions, or a
// definitive diagnosis (enforced by the prompt AND a code-side safety net below).
//
// DEGRADES GRACEFULLY: if NEITHER key is set it returns HTTP 200 { ok:false, reason:'no_key' }
// so the client can fall back cleanly (e.g. on GitHub Pages, where /api 404s). On any upstream
// error it returns 200 { ok:false, reason:'error', message } and NEVER leaks the key.
//
// No key is ever hardcoded — keys come from Vercel environment variables only:
//   DEEPSEEK_API_KEY   (preferred)   |   ANTHROPIC_API_KEY   (fallback)

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEEPSEEK_MODEL = 'deepseek-chat';
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

// The exact sentence the `consider` field MUST end with (honesty lock).
const REQUIRED_TAIL = '— AI-drafted considerations from the questionnaire; not a diagnosis or treatment recommendation. The provider makes and signs every clinical decision.';

const SYSTEM = `You are a clinical scribe drafting ONLY the narrative sections of a SOAP note from a patient's intake questionnaire, for a licensed provider to review, edit, and sign. Draft three fields: \`hpi\` (a concise History of Present Illness narrative synthesized from the intake — onset, duration, associated symptoms, the patient's self-scores, goals; end with 'provider to confirm on exam.'), \`ros\` (a brief system-by-system Review of Systems from reported symptoms), and \`consider\` (a NON-prescriptive 'considerations & suggested workup' note — areas/labs to evaluate, 'confirm before any treatment decision'). ABSOLUTE RULES: never output medications, doses, specific prescriptions, or a definitive diagnosis. \`consider\` MUST end with exactly: '${REQUIRED_TAIL}' Output STRICT JSON: {"hpi":"...","ros":"...","consider":"..."}.`;

// ---- HTTP plumbing (CORS + JSON, dependency-free) ----
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

// Read the JSON body across Vercel (pre-parsed) and plain Node (raw stream).
async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  }
  if (!req.readable) return {};
  const chunks = [];
  try { for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c); }
  catch { return {}; }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}

const clip = (s, n) => String(s == null ? '' : s).slice(0, n);

// Normalize the intake payload into a compact object we hand to the model.
function buildPatient(body) {
  const b = body || {};
  const sc = b.scores && typeof b.scores === 'object' ? b.scores : {};
  const numOrNull = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
  return {
    name: clip(b.name, 120),
    sex: clip(b.sex, 24),
    dob: clip(b.dob, 40),
    cc: clip(b.cc, 800),
    scores: {
      energy: numOrNull(sc.energy), libido: numOrNull(sc.libido),
      sleep: numOrNull(sc.sleep), mood: numOrNull(sc.mood),
    },
    meds: clip(b.meds, 2000),
    allergies: clip(b.allergies, 600),
    flags: Array.isArray(b.flags) ? b.flags.slice(0, 40).map((x) => clip(x, 240)) : [],
    labs: Array.isArray(b.labs) ? b.labs.slice(0, 80).map((x) => clip(x, 240)) : [],
  };
}

// ---- AI calls (env-gated). Never throw the key; surface only status/message. ----
async function callDeepseek(key, userJson) {
  const r = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: userJson },
      ],
    }),
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) {
    const e = new Error((data && data.error && data.error.message) || ('DeepSeek ' + r.status));
    e.status = r.status; throw e;
  }
  const msg = data && data.choices && data.choices[0] && data.choices[0].message;
  return String((msg && msg.content) || '');
}

async function callAnthropic(key, userJson) {
  const r = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 900,
      temperature: 0.3,
      system: SYSTEM + '\n\nReturn ONLY the raw JSON object — no prose, no code fences.',
      messages: [{ role: 'user', content: userJson }],
    }),
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) {
    const e = new Error((data && data.error && data.error.message) || ('Anthropic ' + r.status));
    e.status = r.status; throw e;
  }
  const blocks = data && Array.isArray(data.content) ? data.content : [];
  return String(blocks.filter((b) => b && b.type === 'text').map((b) => b.text).join('') || '');
}

// Pull a JSON object out of the model text (handles code fences / stray prose).
function parseModelJson(text) {
  if (!text) return null;
  let t = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try { return JSON.parse(t); } catch { /* fall through */ }
  const a = t.indexOf('{'), z = t.lastIndexOf('}');
  if (a >= 0 && z > a) { try { return JSON.parse(t.slice(a, z + 1)); } catch { /* fall through */ } }
  return null;
}

// ---- Safety net: strip any sentence that names a medication/dose/prescription. ----
// A "dose" = number+unit NOT followed by "/" (so lab concentrations like "108 mg/dL" survive).
const DOSE_RE = /\b\d+(?:\.\d+)?\s?(?:mg|mcg|µg|ug|g|iu|units?|cc|ml|meq|mmol|puffs?|tabs?|caps?)\b(?!\s*\/)/i;
const RX_WORD_RE = /\b(?:prescrib\w*|prescription|doses?|dosage|dosing|titrat\w*)\b/i;
const DRUG_SUFFIX_RE = /\b[a-z]{3,}(?:statin|sartan|pril|olol|dipine|prazole|azole|mycin|cycline|parin|formin|mab|nib|caine|codone|morphone)\b/i;
const offending = (s) => DOSE_RE.test(s) || RX_WORD_RE.test(s) || DRUG_SUFFIX_RE.test(s);

function sanitizeField(text, flags, label) {
  const s = String(text == null ? '' : text).trim();
  if (!s) return '';
  const parts = s.match(/[^.!?]+[.!?]*\s*/g) || [s];
  const kept = [];
  let removed = 0;
  for (const p of parts) {
    if (offending(p)) { removed++; continue; }
    kept.push(p);
  }
  let out = kept.join('').trim();
  if (removed) {
    flags.push('Safety filter removed ' + removed + ' sentence(s) from ' + label +
      ' that named a medication or dose — the provider completes meds/doses directly.');
    out = (out ? out + ' ' : '') +
      '[a medication/dose statement was removed by the safety filter — provider completes meds/doses].';
  }
  return out;
}

// Guarantee `consider` ends with exactly the required honesty tail.
function enforceTail(consider) {
  let c = String(consider == null ? '' : consider).trim();
  if (!c.endsWith(REQUIRED_TAIL)) {
    c = c.replace(/[—-]\s*AI-drafted considerations from the questionnaire[\s\S]*$/i, '').trim();
    c = (c ? c + ' ' : '') + REQUIRED_TAIL;
  }
  return c;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST, OPTIONS'); return json(res, 405, { ok: false, reason: 'method', message: 'POST only' }); }

  // Env-gated: DeepSeek first, then Anthropic; neither -> clean no_key so the client falls back.
  const dsKey = (process.env.DEEPSEEK_API_KEY || '').trim();
  const anKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!dsKey && !anKey) return json(res, 200, { ok: false, reason: 'no_key' });

  let body;
  try { body = await readBody(req); } catch { body = {}; }
  const userJson = JSON.stringify(buildPatient(body));

  const provider = dsKey ? 'deepseek' : 'anthropic';
  let raw;
  try {
    raw = dsKey ? await callDeepseek(dsKey, userJson) : await callAnthropic(anKey, userJson);
  } catch (e) {
    return json(res, 200, { ok: false, reason: 'error', message: String((e && e.message) || e).slice(0, 300) });
  }

  const parsed = parseModelJson(raw);
  if (!parsed || typeof parsed !== 'object') {
    return json(res, 200, { ok: false, reason: 'error', message: 'Could not parse an AI draft from the model response.' });
  }

  const flags = [];
  const hpi = sanitizeField(parsed.hpi, flags, 'HPI');
  const ros = sanitizeField(parsed.ros, flags, 'Review of Systems');
  const consider = enforceTail(sanitizeField(parsed.consider, flags, 'Considerations'));

  // If nothing usable came back, let the client fall back rather than show an empty "draft".
  if (!hpi && !ros && !consider.replace(REQUIRED_TAIL, '').trim()) {
    return json(res, 200, { ok: false, reason: 'error', message: 'The model returned an empty draft.' });
  }

  return json(res, 200, { ok: true, hpi, ros, consider, model: provider, flags });
}

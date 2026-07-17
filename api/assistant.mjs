// /api/assistant — the REAL in-hub AI helper for Barry Burris, NMD.
//
// House pattern (Accelerated Experiences, LLC): Vercel Node serverless (ESM), env-gated,
// DeepSeek first -> Anthropic fallback. Dependency-free (raw fetch) so it runs in a plain
// static + /api repo with no node_modules.
//
// This is Barry's own provider-facing assistant. It helps him RUN the practice: draft a
// patient reply, summarize a chart he pastes in, explain a lab result in plain language,
// suggest functional-medicine protocols to CONSIDER, write practice copy, and answer
// "how do I / where is X" about his own hub. It is decision support — Barry is the licensed
// provider who verifies, adjusts, and signs every clinical decision, diagnosis, med, and dose.
//
// DEGRADES GRACEFULLY: no key -> 200 { ok:false, reason:'no_key' } so the widget shows a
// friendly "finishing setup" state. On upstream error -> 200 { ok:false, reason:'error' }.
// No key is ever hardcoded — keys come from Vercel env only:
//   DEEPSEEK_API_KEY  (preferred)  |  ANTHROPIC_API_KEY  (fallback)

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEEPSEEK_MODEL = 'deepseek-chat';
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

const SYSTEM = `You are the in-hub assistant for the practice of **Barry Burris, NMD** — a naturopathic / functional-medicine and longevity practice. The hub was built for Dr. Burris by Accelerated Experiences, LLC. You are talking to Dr. Burris (or his staff), NOT to a patient.

WHO YOU HELP WITH WHAT:
- Draft warm, plain-language patient messages, emails, appointment reminders, and follow-ups (in English or Vietnamese — many of his patients are in Vietnam; offer both when useful).
- Summarize a patient / chart the provider pastes in (turn notes into a tidy summary or a clean SOAP structure).
- Explain a lab result or clinical concept in plain language the provider can hand to a patient.
- Suggest functional / naturopathic protocols and workup to CONSIDER (lifestyle, nutrition, botanicals/supplements, and medications/peptides/hormones where clinically appropriate) — always as options for the provider to weigh.
- Write practice content: service descriptions, intake questions, website copy, protocol handouts.
- Answer "how do I…" / "where is…" about THIS hub (see the map below).

THE HUB MAP (so you can guide him):
- Practice: Home (dashboard), AE Welcome (his gift/tour), Calendar, Contacts (CRM), Intakes (patient questionnaires — each opens an AI-drafted SOAP note), Charting (the SOAP note tool), Video Visits (native "AE Connect" video — no third party), Records.
- Business: Billing (invoices), Services (offerings + pricing), Labs (orders/results).
- Grow: Protocols, Growth, Team, Profile, Privacy & Security.
- Also: a Patient Portal (patients sign up, see care plan, message, join video), translated patient↔provider messaging, a two-path system (International patients live now / US patients gated until HIPAA-ready), and the hub installs as an app on phone/tablet.

HONESTY GUARDRAIL (non-negotiable): You are clinical DECISION SUPPORT, not the decision. Dr. Burris is the licensed provider who verifies, adjusts, and signs every diagnosis, medication, and dose. Never invent patient data, lab values, or history — if something wasn't given to you, say so and ask for it. When you suggest anything clinical, frame it as options to consider and note what would confirm or exclude it. Gently avoid pasting fully identifying patient info until secure mode is on.

STYLE: Warm, concise, practical — like a sharp clinic manager who respects the doctor's time. Use short paragraphs and simple bullet lists ("- ") when it helps. Get to the point. If a request is ambiguous, make one reasonable assumption and note it rather than stalling with questions.`;

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

// Normalize the incoming chat history into a clean alternating list that starts with 'user'.
// Accepts { messages:[{role:'user'|'assistant', content}], page } OR a single { message }.
function buildMessages(body) {
  const b = body || {};
  let msgs = [];
  if (Array.isArray(b.messages)) {
    msgs = b.messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && (m.content || m.text))
      .map((m) => ({ role: m.role, content: clip(m.content != null ? m.content : m.text, 6000) }));
  }
  if (!msgs.length && (b.message || b.text)) {
    msgs = [{ role: 'user', content: clip(b.message || b.text, 6000) }];
  }
  // Keep the last 14 turns.
  if (msgs.length > 14) msgs = msgs.slice(-14);
  // Collapse any accidental consecutive same-role turns and ensure it starts with 'user'.
  const out = [];
  for (const m of msgs) {
    if (out.length && out[out.length - 1].role === m.role) { out[out.length - 1].content += '\n\n' + m.content; }
    else out.push({ role: m.role, content: m.content });
  }
  while (out.length && out[0].role !== 'user') out.shift();
  if (out.length && out[out.length - 1].role !== 'user') {
    // Last turn must be the user's question for the model to answer.
    out.push({ role: 'user', content: '(continue)' });
  }
  // Prepend a tiny context line about where in the hub the user is asking from.
  const page = clip(b.page, 80).trim();
  if (page && out.length) out[0] = { role: 'user', content: '[Context: I am on the "' + page + '" screen of my hub.]\n\n' + out[0].content };
  return out;
}

async function callDeepseek(key, messages) {
  const r = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      temperature: 0.5,
      max_tokens: 1100,
      messages: [{ role: 'system', content: SYSTEM }].concat(messages),
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

async function callAnthropic(key, messages) {
  const r = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1100,
      temperature: 0.5,
      system: SYSTEM,
      messages: messages,
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

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST, OPTIONS'); return json(res, 405, { ok: false, reason: 'method', message: 'POST only' }); }

  const dsKey = (process.env.DEEPSEEK_API_KEY || '').trim();
  const anKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!dsKey && !anKey) return json(res, 200, { ok: false, reason: 'no_key' });

  let body;
  try { body = await readBody(req); } catch { body = {}; }
  const messages = buildMessages(body);
  if (!messages.length) return json(res, 200, { ok: false, reason: 'empty', message: 'No message to answer.' });

  const provider = dsKey ? 'deepseek' : 'anthropic';
  let reply;
  try {
    reply = dsKey ? await callDeepseek(dsKey, messages) : await callAnthropic(anKey, messages);
  } catch (e) {
    return json(res, 200, { ok: false, reason: 'error', message: String((e && e.message) || e).slice(0, 300) });
  }

  reply = clip(reply, 8000).trim();
  if (!reply) return json(res, 200, { ok: false, reason: 'error', message: 'The model returned an empty reply.' });

  return json(res, 200, { ok: true, reply, model: provider });
}

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

const SYSTEM = `You are **Brian** — the in-hub AI right hand for the practice of **Barry Burris, NMD**, a naturopathic / functional-medicine and longevity practice. The hub was built for Dr. Burris by Accelerated Experiences, LLC. You're talking to Dr. Burris himself (or his staff) — never to a patient.

PERSONALITY — be a wizard, not a help desk:
- You're sharp, fast, and deeply knowledgeable — the right hand who makes Barry look great. Confidence earned by competence.
- Barry has a good sense of humor. Banter with him, riff, drop a dry joke, shoot the breeze when he wants to. Match his energy — if he's loose and salty, loosen up (a little salt back is fine); if he's heads-down, be crisp and get out of his way.
- The moment it turns clinical, legal, financial, or a real decision, you snap to precise, careful, and honest. Wit never at the expense of accuracy.
- Talk like a person, not a brochure. Lead with the answer. Your replies are often SPOKEN ALOUD in your voice, so keep them tight and natural — a few sentences, not walls of bullets. Avoid markdown symbols that sound weird read aloud. Go deep only when he asks.

WHAT YOU DO:
- Draft warm, plain-language patient messages, emails, reminders, follow-ups — English or Vietnamese (many of his patients are in Vietnam; offer both when useful).
- Turn pasted notes into a tidy summary or clean SOAP note; explain a lab result or concept in plain language he can hand a patient.
- Suggest functional/naturopathic protocols and workup to CONSIDER (lifestyle, nutrition, botanicals/supplements, meds/peptides/hormones where appropriate) — always options for him to weigh.
- Write practice copy (services, intake questions, handouts, website).
- Guide him around this hub (map below).
- Be his business + strategy brain: the economics of running an NMD practice, and his move to North Idaho + interviews as a contractor or partner (knowledge below).

THE HUB MAP:
- Practice: Home (dashboard), AE Welcome (his gift/tour), Calendar, Contacts (CRM), Intakes (patient questionnaires — each opens an AI-drafted SOAP note), Charting (the SOAP tool), Video Visits (native "AE Connect" video, no third party), Records.
- Business: Billing (invoices), Services (offerings + pricing), Labs.
- Grow: Protocols, Growth, Team, Profile, Privacy & Security.
- Also: a Patient Portal, translated patient↔provider messaging, a two-path system (International patients live now / US gated until HIPAA-ready), and the hub installs as an app on phone/tablet. You (Brian) ride along on every staff screen.

WHAT YOU KNOW COLD — Idaho + North Idaho (current as of 2026):
- Idaho LICENSES naturopathic medical doctors (NMDs). Licensure runs through DOPL (Division of Occupational and Professional Licenses); the Allied Health Advisory Board reviews applications and advises the State Board of Medicine, which issues the license. (Idaho also has a separate, lower "naturopath" registration under the Board of Naturopathic Health Care — but as an NMD, Barry's path is the Board-of-Medicine NMD license.)
- To get licensed: graduate an accredited naturopathic medical program, pass all four NPLEX exams (Part I Biomedical; Part II Core Clinical; Part II Clinical Elective Minor Surgery; Part II Clinical Elective Pharmacology), and clear an Idaho + FBI fingerprint background check. Contact: HP-Licensing@dopl.idaho.gov, (208) 334-3233.
- Idaho NMD scope: physical exams; order labs/imaging/diagnostics; dispense/administer/prescribe per the naturopathic formulary; minor office procedures; hospital admitting where credentialed. NMDs are designated PRIMARY CARE PROVIDERS. No obstetrics.
- Formulary = non-controlled legend medications, EXCLUDING testosterone (a "formulary of exclusion" in the Rules). Flag testosterone specifically — it's out for Idaho NMDs; no controlled substances; other hormones/peptides depend on the formulary.
- North Idaho scene: Kootenai Health (Coeur d'Alene) is the anchor — a ~381-bed regional hospital serving North Idaho, Eastern WA and Western MT, with a family-medicine residency. Around it is a real integrative/naturopathic ecosystem: Functional Medicine of North Idaho, Northwest Integrated Health, Lakeside Holistic Health, Coeur Vitality (Coeur d'Alene / Post Falls) and a dense naturopathic cluster in Sandpoint (Green Mountain Medicine, The Natural Path, Aspen Wellspring, plus several solo NDs). Fast-growing, health-freedom-friendly, cash-pay-friendly market — good ground for an NMD to contract or partner.

THE BUSINESS OF AN NMD PRACTICE (coach him):
- Revenue models: mostly cash-pay / out-of-network; membership or concierge (monthly retainer); per-visit fees; a supplement dispensary (retail margin, e.g. Fullscript); in-house or referral labs; IV therapy & injectables (Myers, B12, glutathione); hormone/peptide programs (mind the Idaho formulary); aesthetics; telehealth (his hub already does this).
- Contractor vs partner structures he'll hear in interviews: 1099 independent contractor (space rental or % of collections, e.g. 60/40); W2 employee (salary or productivity); partnership/equity (buy-in + profit share); or medical directorship (supervising provider for a med-spa/IV clinic). Diligence points: who carries malpractice, non-compete radius/term (Idaho enforces reasonable ones), patient/chart ownership, dispensary & ancillary revenue splits, call/coverage, overhead responsibility, and any ramp or income guarantee.
- Interview prep: help him know his numbers (panel size, revenue/visit, no-show rate), name what he uniquely brings (turnkey telehealth + bilingual reach + this hub), and pressure-test any offer's split and restrictive covenant.

HONESTY GUARDRAIL (non-negotiable): You're DECISION SUPPORT, not the decision. Barry is the licensed provider who verifies, adjusts, and signs every diagnosis, medication, and dose. You're not his lawyer or CPA — for contracts, licensure specifics, and tax/entity questions, give him the lay of the land, then tell him to confirm with an Idaho attorney or CPA before he signs. Never invent patient data, lab values, legal citations, or numbers — if you don't have it, say so and ask. Keep fully identifying patient info out of chat until secure mode is on.`;

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

// /api/voice — Brian's voice for Barry Burris, NMD (ElevenLabs text-to-speech).
//
// Cloned from the proven ESPO Fret voice endpoint so Barry's Brian sounds EXACTLY like
// espofret.com's Brian. Uses the SAME env-var names, so Anthony can copy the same values:
//   ELEVENLABS_API_KEY   (required) — the ElevenLabs key
//   ELEVENLABS_VOICE_ID  (optional) — Brian's Voice ID; falls back to the public "Brian" voice
//   ELEVENLABS_MODEL_ID  (optional) — defaults to eleven_flash_v2_5 (fast, multilingual)
//
// Env-gated: with no key it returns 200 { ok:false, reason:'no_key' } so the assistant
// panel simply stays silent (text still works) instead of erroring. No key is ever hardcoded.
// Built by Accelerated Experiences, LLC.

const BRIAN_FALLBACK_VOICE = 'nPczCjzI2devNBz1zQrb'; // ElevenLabs public "Brian"


// Oct 22 2026 (Anthony: "use turbo on every app and OS and MOS ... everyone that is live"): this door now asks the AE
// house voice engine for the line, in Turbo, the same way every AE app does (SSOT 0.10: one voice machine for the house;
// ElevenLabs is retired). The app's pages are unchanged: they still POST {text} here and get audio back.
async function houseTake(text, voice) {
  const r = await fetch('https://www.aexperiences.com/api/voice', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: String(text).slice(0, 900), voice, model: 'turbo' }),
    signal: AbortSignal.timeout(120000)
  });
  const ct = (r.headers.get('content-type') || '').split(';')[0];
  if (!r.ok || ct.indexOf('audio') !== 0) return null;
  return { ct, buf: Buffer.from(await r.arrayBuffer()) };
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') { res.statusCode = 405; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ ok: false, reason: 'method' })); return; }



  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    if (!body || typeof body !== 'object') {
      // read raw stream when Vercel didn't pre-parse
      const chunks = [];
      try { for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c); } catch {}
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { body = {}; }
    }
    const text = (typeof body.text === 'string' ? body.text : '').trim().slice(0, 1500);
    if (!text) { res.statusCode = 400; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ ok: false, reason: 'no_text' })); return; }

    const take = await houseTake(text, 'brian');
    if (!take) { res.statusCode = 502; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ ok: false, reason: 'engine' })); return; }
    res.statusCode = 200;
    res.setHeader('Content-Type', take.ct);
    res.setHeader('Cache-Control', 'no-store');
    res.end(take.buf);
  } catch (e) {
    res.statusCode = 500; res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, reason: 'error', detail: String((e && e.message) || e).slice(0, 200) }));
  }
}

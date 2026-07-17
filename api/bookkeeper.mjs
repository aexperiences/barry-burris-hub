// /api/bookkeeper — Brian, the AI bookkeeper for Barry Burris, NMD.
//
// Same Brian voice as the hub assistant, but sitting in the Books. You talk or type a command;
// Brian either PROPOSES a ledger entry to post (you confirm, then the books console posts it to
// /api/books) or ANSWERS a question from the live books context the page sends along. He never
// posts money on his own — he proposes, you confirm. Returns STRICT JSON only.
//
// House pattern (Accelerated Experiences, LLC): env-gated, dependency-free. DeepSeek preferred ->
// Anthropic (Haiku) fallback. Graceful no_key. No key hardcoded.

const DEEPSEEK = (process.env.DEEPSEEK_API_KEY || '').trim();
const ANTHROPIC = (process.env.ANTHROPIC_API_KEY || '').trim();

const SYSTEM = `You are **Brian**, the AI bookkeeper for the practice of Barry Burris, NMD — a for-profit naturopathic / functional-medicine practice. Sharp, careful, friendly; you keep clean books and explain plainly. You talk to Dr. Burris. Return STRICT JSON only — no prose, no code fences. Do ONE of two things:

1) POST — he wants to record money. Propose ONE ledger entry (you do NOT post it; he confirms). Shape:
   {"intent":"post","say":"<one friendly sentence describing what you'll record>","event":{"dir":"in"|"out","source":"<income key, for dir in>","category":"<expense key, for dir out>","gross":<number>,"processor":"none"|"stripe"|"square"|"check","patient":"<name if given, else empty>","note":"<short note>"}}
   INCOME sources (dir "in"): visit (patient visits/consults), telehealth, labs, supplement (retail supplement sales — TAXABLE), membership, procedure (in-office/IV), other.
   EXPENSE categories (dir "out"): cogs (product cost of supplements sold), labcost (outside lab bills), rent, payroll, malpractice, software, merchantfee, marketing, cme (CE/licensing/dues), insurance, utilities, supplies (clinical supplies), taxremit (sales tax paid to Idaho), other.
   gross = the full amount (for a taxable supplement sale it's tax-inclusive; Idaho's 6% is carved out automatically, so just give the full amount collected). processor = how it arrived: cash/check = "none"/"check", card = "stripe"/"square".

2) ANSWER — he asked about the books. Use the CONTEXT JSON provided (the current P&L, sales tax, A/R). Shape:
   {"intent":"answer","say":"<clear, specific answer using the REAL numbers from context; short and plain>"}

Rules: record ONE thing at a time. If amount or category is unclear, make your best single proposal and note the assumption in "say". Only supplements/retail are taxable in Idaho — professional services (visits, labs, telehealth) are NOT. Never invent figures when answering — use context; if it's not there, say so. Be honest and warm; you're a great bookkeeper, not a CPA.`;

const clean = (s, n) => String(s == null ? '' : s).replace(/[<>]/g, '').slice(0, n || 600);
function tryParse(txt) {
  if (!txt) return null;
  let s = String(txt).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const a = s.indexOf('{'), z = s.lastIndexOf('}');
  if (a >= 0 && z > a) s = s.slice(a, z + 1);
  try { const o = JSON.parse(s); return (o && typeof o === 'object') ? o : null; } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'POST only' })); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== 'object') {
    const chunks = []; try { for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c); } catch {}
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { body = {}; }
  }
  const command = clean(body.command, 700);
  const reply = (obj) => { res.statusCode = 200; res.setHeader('content-type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)); };
  if (!command) return reply({ configured: true, reply: { intent: 'answer', say: 'Tell me what to record, or ask about the books.' } });

  if (!(DEEPSEEK || ANTHROPIC)) return reply({ configured: false, reply: { intent: 'answer', say: 'I just need the AI key switched on (it powers the whole hub) and I can start keeping your books — recording income and expenses on command and answering questions about the numbers.' } });

  const context = JSON.stringify(body.context || {}).slice(0, 4500);
  const user = 'CONTEXT (the current books):\n' + context + '\n\nCOMMAND:\n' + command;

  try {
    let out = null;
    if (DEEPSEEK) {
      const r = await fetch('https://api.deepseek.com/chat/completions', { method: 'POST', headers: { authorization: 'Bearer ' + DEEPSEEK, 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.2, max_tokens: 700, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }] }) });
      const j = await r.json().catch(() => null); out = tryParse(j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content);
    } else {
      const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': ANTHROPIC, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 700, system: SYSTEM, messages: [{ role: 'user', content: user + '\n\nReturn ONLY the JSON.' }] }) });
      const j = await r.json().catch(() => null); out = tryParse(j && j.content && j.content[0] && j.content[0].text);
    }
    if (!out) return reply({ configured: true, reply: { intent: 'answer', say: 'I couldn\'t quite parse that — try again, e.g. "record a $175 new-patient visit paid by card" or "how much did I make on supplements?"' } });
    return reply({ configured: true, reply: out });
  } catch (e) {
    return reply({ configured: true, reply: { intent: 'answer', say: 'I had trouble reaching the AI for a second — give it another try.' } });
  }
}

/* bb-assistant.js — Barry Burris, NMD · the in-hub AI assistant ("Ask your hub").
   A self-contained slide-in panel with a floating ✨ launcher. Talks to /api/assistant
   (DeepSeek -> Anthropic, env-gated). It's Dr. Burris's provider-facing helper: draft a
   patient reply, summarize a chart, explain a lab, suggest protocols to consider, write
   practice copy, and answer "how do I / where is X" about this hub.

   Decision support only — the licensed provider verifies & signs. Env-gated: if no AI key
   is set the panel shows a friendly "finishing setup" state and never errors out.

   Palette follows the page: staff = classroom-calm RED, patient = SAGE.
   Built by Accelerated Experiences, LLC. */
(function () {
  if (window.__bbAI) return; window.__bbAI = true;

  var API = '/api/assistant';
  var STORE = 'bb_assist_v1';
  var PATIENT = /patient/i.test(location.pathname);
  var T = PATIENT ? { c: '#4a6b52', c2: '#3d5a45' } : { c: '#95463f', c2: '#763530' };
  var thread = load();       // [{role:'user'|'assistant', content}]
  var busy = false;

  function load() { try { var a = JSON.parse(localStorage.getItem(STORE) || '[]'); return Array.isArray(a) ? a.slice(-20) : []; } catch (e) { return []; } }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(thread.slice(-20))); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // Light, SAFE markdown: escape first, then **bold**, `code`, "- " bullets, blank-line paras.
  function md(s) {
    var t = esc(String(s == null ? '' : s).trim());
    t = t.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');
    var lines = t.split(/\r?\n/), html = '', inUl = false;
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (/^\s*[-*]\s+/.test(ln)) {
        if (!inUl) { html += '<ul>'; inUl = true; }
        html += '<li>' + ln.replace(/^\s*[-*]\s+/, '') + '</li>';
      } else {
        if (inUl) { html += '</ul>'; inUl = false; }
        if (ln.trim() === '') html += '<br>'; else html += '<div>' + ln + '</div>';
      }
    }
    if (inUl) html += '</ul>';
    return html;
  }

  function css() {
    if (document.getElementById('bbai-css')) return;
    var s = document.createElement('style'); s.id = 'bbai-css';
    s.textContent = [
      '#bbai-btn{position:fixed;right:18px;bottom:20px;z-index:1400;height:56px;padding:0 18px 0 15px;border-radius:28px;border:none;cursor:pointer;',
      'background:linear-gradient(180deg,' + T.c + ',' + T.c2 + ');color:#fff;box-shadow:0 8px 24px rgba(40,25,20,.32);display:flex;align-items:center;gap:9px;font-family:Oswald,system-ui,sans-serif;font-weight:600;font-size:13px;letter-spacing:.05em;text-transform:uppercase}',
      '#bbai-btn .sp{font-size:19px;line-height:1}',
      '#bbai-btn:hover{filter:brightness(1.06)}',
      '@media(max-width:900px){#bbai-btn{bottom:calc(74px + env(safe-area-inset-bottom));padding:0 15px}#bbai-btn .lbl{display:none}#bbai-btn{width:56px;justify-content:center;border-radius:50%}}',
      '#bbai-scrim{position:fixed;inset:0;z-index:1401;background:rgba(20,14,10,.4);opacity:0;pointer-events:none;transition:opacity .2s}',
      '#bbai-scrim.on{opacity:1;pointer-events:auto}',
      '#bbai{position:fixed;top:0;right:0;bottom:0;z-index:1402;width:400px;max-width:94vw;background:#fffdf8;border-left:1px solid #e6ddca;',
      'box-shadow:-12px 0 40px rgba(40,25,15,.18);transform:translateX(102%);transition:transform .24s ease;display:flex;flex-direction:column;font-family:Inter,system-ui,-apple-system,sans-serif}',
      '#bbai.on{transform:none}',
      '#bbai .h{display:flex;align-items:center;gap:11px;padding:14px 16px;background:linear-gradient(180deg,' + T.c + ',' + T.c2 + ');color:#fff}',
      '#bbai .h .ic{width:34px;height:34px;flex:none;border-radius:50%;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;font-size:18px}',
      '#bbai .h .t{font-family:Fraunces,Georgia,serif;font-weight:700;font-size:16px;line-height:1.05}',
      '#bbai .h .sub{font-size:11px;opacity:.82;margin-top:1px}',
      '#bbai .h .clr{margin-left:auto;background:rgba(255,255,255,.14);border:none;color:#fff;border-radius:8px;padding:5px 9px;cursor:pointer;font-size:11.5px;font-weight:600}',
      '#bbai .h .x{background:transparent;border:none;color:#fff;font-size:22px;cursor:pointer;line-height:1;padding:0 2px}',
      '#bbai .body{flex:1;overflow:auto;background:#f7f2e7;padding:14px}',
      '#bbai .intro{color:#5f5340;font-size:14px;line-height:1.5}',
      '#bbai .intro b{color:#2a2118}',
      '#bbai .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}',
      '#bbai .chip{border:1px solid #e0d6bf;background:#fffdf8;color:#6b4f2a;border-radius:999px;padding:8px 12px;font-size:12.5px;cursor:pointer;font-weight:600}',
      '#bbai .chip:hover{border-color:' + T.c + ';color:' + T.c + '}',
      '#bbai .b{max-width:88%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.5;margin-bottom:10px;word-wrap:break-word;overflow-wrap:anywhere}',
      '#bbai .b.them{align-self:flex-start;background:#fff;border:1px solid #e6ddca;color:#2a2118;border-top-left-radius:5px}',
      '#bbai .b.me{align-self:flex-end;background:' + T.c + ';color:#fff;margin-left:auto;border-top-right-radius:5px;white-space:pre-wrap}',
      '#bbai .b.them ul{margin:5px 0 2px;padding-left:19px}#bbai .b.them li{margin:2px 0}',
      '#bbai .b.them code{background:#f1ead9;border-radius:4px;padding:1px 5px;font-size:12.5px}',
      '#bbai .dots span{display:inline-block;width:6px;height:6px;margin-right:3px;border-radius:50%;background:#b9a789;animation:bbaiP 1s infinite}',
      '#bbai .dots span:nth-child(2){animation-delay:.15s}#bbai .dots span:nth-child(3){animation-delay:.3s}',
      '@keyframes bbaiP{0%,60%,100%{opacity:.3}30%{opacity:1}}',
      '#bbai .foot{font-size:10.5px;color:#9a8c70;padding:7px 14px;background:#fbf7ee;border-top:1px solid #ece3d0;line-height:1.4;text-align:center}',
      '#bbai .c{display:flex;gap:8px;padding:11px;border-top:1px solid #e6ddca;background:#fffdf8}',
      '#bbai .c textarea{flex:1;border:1px solid #e0d6bf;border-radius:12px;padding:11px 12px;font:inherit;font-size:14px;color:#2a2118;resize:none;max-height:120px;min-height:44px;line-height:1.4}',
      '#bbai .c textarea:focus{outline:none;border-color:' + T.c + '}',
      '#bbai .c button{border:none;border-radius:12px;background:linear-gradient(180deg,' + T.c + ',' + T.c2 + ');color:#fff;padding:0 16px;font-weight:700;cursor:pointer;flex:none}',
      '#bbai .c button:disabled{opacity:.5;cursor:default}'
    ].join('');
    document.head.appendChild(s);
  }

  var launcher, panel, scrim, bodyEl, inputEl, sendEl;
  var CHIPS = [
    ['✍️ Draft a patient reply', 'Draft a warm, plain-language reply to this patient message:\n\n'],
    ['🧾 Summarize a chart', 'Summarize these notes into a clean SOAP note:\n\n'],
    ['🔬 Explain a lab result', 'Explain this lab result in plain language I can share with a patient:\n\n'],
    ['🌿 Protocol ideas', 'Suggest functional-medicine protocols to consider for: '],
    ['❓ How do I…', 'How do I ']
  ];

  function build() {
    css();
    launcher = document.createElement('button'); launcher.id = 'bbai-btn'; launcher.type = 'button';
    launcher.setAttribute('aria-label', 'Open your hub assistant');
    launcher.innerHTML = '<span class="sp">✨</span><span class="lbl">Assistant</span>';
    scrim = document.createElement('div'); scrim.id = 'bbai-scrim';
    panel = document.createElement('aside'); panel.id = 'bbai'; panel.setAttribute('aria-label', 'Hub assistant');
    panel.innerHTML =
      '<div class="h"><div class="ic">✨</div><div><div class="t">Assistant</div><div class="sub">Ask your hub anything</div></div>' +
      '<button class="clr" id="bbai-clr" type="button" title="New chat">New</button>' +
      '<button class="x" id="bbai-x" aria-label="Close">×</button></div>' +
      '<div class="body" id="bbai-body"></div>' +
      '<div class="foot">Decision support — you verify &amp; sign. Keep fully identifying patient info out until secure mode is on.</div>' +
      '<div class="c"><textarea id="bbai-in" rows="1" placeholder="Ask, or paste notes to work on…" aria-label="Message the assistant"></textarea><button id="bbai-send" type="button">Send</button></div>';
    document.body.appendChild(launcher); document.body.appendChild(scrim); document.body.appendChild(panel);
    bodyEl = panel.querySelector('#bbai-body'); inputEl = panel.querySelector('#bbai-in'); sendEl = panel.querySelector('#bbai-send');

    launcher.addEventListener('click', openPanel);
    scrim.addEventListener('click', closePanel);
    panel.querySelector('#bbai-x').addEventListener('click', closePanel);
    panel.querySelector('#bbai-clr').addEventListener('click', function () { thread = []; save(); render(); inputEl.focus(); });
    sendEl.addEventListener('click', send);
    inputEl.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
    inputEl.addEventListener('input', autoGrow);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('on')) closePanel(); });
    render();
  }

  function autoGrow() { inputEl.style.height = 'auto'; inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px'; }
  function openPanel() { panel.classList.add('on'); scrim.classList.add('on'); setTimeout(function () { inputEl.focus(); scrollDown(); }, 60); }
  function closePanel() { panel.classList.remove('on'); scrim.classList.remove('on'); }
  function scrollDown() { if (bodyEl) bodyEl.scrollTop = bodyEl.scrollHeight; }

  function pageName() {
    var k = window.BB_NAV_ACTIVE || '';
    if (k) return String(k);
    var t = (document.title || '').split('—')[0].split('|')[0].trim();
    return t || 'Home';
  }

  function render() {
    if (!thread.length) {
      var chips = CHIPS.map(function (c, i) { return '<button class="chip" data-i="' + i + '" type="button">' + esc(c[0]) + '</button>'; }).join('');
      bodyEl.innerHTML = '<div class="intro"><b>Hi Dr. Burris — how can I help?</b><br>I can draft patient messages, turn your notes into a SOAP note, explain a lab result, suggest protocols to consider, write practice copy, or show you where things live in the hub.<div class="chips">' + chips + '</div></div>';
      [].slice.call(bodyEl.querySelectorAll('.chip')).forEach(function (ch) {
        ch.addEventListener('click', function () { var c = CHIPS[+ch.getAttribute('data-i')]; inputEl.value = c[1]; autoGrow(); inputEl.focus(); inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length); });
      });
      return;
    }
    bodyEl.innerHTML = '';
    thread.forEach(function (m) {
      var div = document.createElement('div'); div.className = 'b ' + (m.role === 'user' ? 'me' : 'them');
      if (m.role === 'user') div.textContent = m.content; else div.innerHTML = md(m.content);
      bodyEl.appendChild(div);
    });
    scrollDown();
  }

  function showTyping() {
    var div = document.createElement('div'); div.className = 'b them dots'; div.id = 'bbai-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    bodyEl.appendChild(div); scrollDown();
  }
  function clearTyping() { var t = document.getElementById('bbai-typing'); if (t) t.remove(); }

  function send() {
    if (busy) return;
    var txt = (inputEl.value || '').trim(); if (!txt) return;
    thread.push({ role: 'user', content: txt }); save();
    inputEl.value = ''; autoGrow(); render();
    busy = true; sendEl.disabled = true; showTyping();
    fetch(API, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: thread.slice(-14), page: pageName() })
    }).then(function (r) { return r.json(); }).catch(function () { return { ok: false, reason: 'net' }; })
      .then(function (r) {
        clearTyping(); busy = false; sendEl.disabled = false;
        var reply;
        if (r && r.ok && r.reply) reply = r.reply;
        else if (r && r.reason === 'no_key') reply = "I'm almost ready — the practice just needs to switch on the AI key in the hub's settings, then I can answer live. (Everything else in your hub already works.)";
        else if (r && r.reason === 'net') reply = "I couldn't reach the server just now. Check your connection and try again.";
        else reply = "Something hiccupped on my end" + (r && r.message ? ' (' + r.message + ')' : '') + '. Give it another try in a moment.';
        thread.push({ role: 'assistant', content: reply }); save(); render(); inputEl.focus();
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();

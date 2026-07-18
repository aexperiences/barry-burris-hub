/* bb-assistant.js — "Brian", the in-hub AI wizard for Barry Burris, NMD.
   Floating ✨ launcher + slide-in panel. Talks to /api/assistant (DeepSeek -> Anthropic).
   VOICE: Brian speaks his replies via /api/voice (ElevenLabs "Brian", same voice as
   espofret.com) and Barry can talk back via on-device speech recognition (Web Speech API).

   Decision support only — the licensed provider verifies & signs. Env-gated: if the AI or
   voice keys aren't set, it degrades gracefully (text still works; it just won't speak).
   Palette follows the page: staff = classroom-calm RED, patient = SAGE.
   Built by Accelerated Experiences, LLC. */
(function () {
  if (window.__bbAI) return; window.__bbAI = true;

  var API = '/api/assistant';
  var VOICE_API = '/api/voice';
  var STORE = 'bb_assist_v1';
  var VKEY = 'bb_assist_voice';
  var PATIENT = /patient/i.test(location.pathname);
  var T = PATIENT ? { c: '#4a6b52', c2: '#3d5a45' } : { c: '#95463f', c2: '#763530' };
  var thread = load();       // [{role:'user'|'assistant', content}]
  var busy = false;
  var voiceOn = loadVoice(); // Brian speaks replies by default

  // ---- audio + speech plumbing (cloned from the proven espofret Brian voice) ----
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null, audioEl = null;
  var SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var recog = null, listening = false;

  function load() { try { var a = JSON.parse(localStorage.getItem(STORE) || '[]'); return Array.isArray(a) ? a.slice(-20) : []; } catch (e) { return []; } }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(thread.slice(-20))); } catch (e) {} }
  function loadVoice() { try { var v = localStorage.getItem(VKEY); return v === null ? true : v === '1'; } catch (e) { return true; } }
  function saveVoice() { try { localStorage.setItem(VKEY, voiceOn ? '1' : '0'); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // Light, SAFE markdown for on-screen bubbles.
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

  // Strip markdown/symbols so the spoken version sounds natural.
  function plain(s) {
    return String(s == null ? '' : s)
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/[*_#>~]/g, '')
      .replace(/^\s*[-•]\s+/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
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
      '#bbai .h .vc{margin-left:auto;background:rgba(255,255,255,.14);border:none;color:#fff;border-radius:8px;padding:5px 8px;cursor:pointer;font-size:15px;line-height:1}',
      '#bbai .h .vc.off{opacity:.5}',
      '#bbai .h .clr{background:rgba(255,255,255,.14);border:none;color:#fff;border-radius:8px;padding:5px 9px;cursor:pointer;font-size:11.5px;font-weight:600}',
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
      '#bbai .c{display:flex;gap:8px;padding:11px;border-top:1px solid #e6ddca;background:#fffdf8;align-items:flex-end}',
      '#bbai .c .mic{flex:none;width:44px;height:44px;border-radius:12px;border:1px solid #e0d6bf;background:#fffdf8;color:' + T.c + ';font-size:18px;cursor:pointer}',
      '#bbai .c .mic.on{background:' + T.c + ';color:#fff;border-color:' + T.c + ';animation:bbaiPulse 1s infinite}',
      '#bbai .c .mic.hide{display:none}',
      '@keyframes bbaiPulse{0%,100%{box-shadow:0 0 0 0 rgba(149,70,63,.5)}50%{box-shadow:0 0 0 6px rgba(149,70,63,0)}}',
      '#bbai .c textarea{flex:1;border:1px solid #e0d6bf;border-radius:12px;padding:11px 12px;font:inherit;font-size:14px;color:#2a2118;resize:none;max-height:120px;min-height:44px;line-height:1.4}',
      '#bbai .c textarea:focus{outline:none;border-color:' + T.c + '}',
      '#bbai .c .send{border:none;border-radius:12px;background:linear-gradient(180deg,' + T.c + ',' + T.c2 + ');color:#fff;padding:0 16px;height:44px;font-weight:700;cursor:pointer;flex:none}',
      '#bbai .c .send:disabled{opacity:.5;cursor:default}'
    ].join('');
    document.head.appendChild(s);
  }

  var launcher, panel, scrim, bodyEl, inputEl, sendEl, micEl, voiceEl;
  var CHIPS = [
    ['✍️ Draft a patient reply', 'Draft a warm, plain-language reply to this patient message:\n\n'],
    ['🧾 Summarize a chart', 'Summarize these notes into a clean SOAP note:\n\n'],
    ['🔬 Explain a lab result', 'Explain this lab result in plain language I can share with a patient:\n\n'],
    ['📊 Market research', 'What am I missing that other practices in my market have?'],
    ['🏔️ North Idaho', 'Coach me on '],
    ['❓ How do I…', 'How do I ']
  ];

  function build() {
    css();
    launcher = document.createElement('button'); launcher.id = 'bbai-btn'; launcher.type = 'button';
    launcher.setAttribute('aria-label', 'Open Brian, your hub assistant');
    launcher.innerHTML = '<span class="sp">✨</span><span class="lbl">Brian</span>';
    scrim = document.createElement('div'); scrim.id = 'bbai-scrim';
    panel = document.createElement('aside'); panel.id = 'bbai'; panel.setAttribute('aria-label', 'Brian — hub assistant');
    panel.innerHTML =
      '<div class="h"><div class="ic">✨</div><div><div class="t">Brian</div><div class="sub">Your hub wizard — ask me anything</div></div>' +
      '<button class="vc" id="bbai-voice" type="button" title="Brian\'s voice">' + (voiceOn ? '🔊' : '🔇') + '</button>' +
      '<button class="clr" id="bbai-clr" type="button" title="New chat">New</button>' +
      '<button class="x" id="bbai-x" aria-label="Close">×</button></div>' +
      '<div class="body" id="bbai-body"></div>' +
      '<div class="foot">Decision support — you verify &amp; sign. Keep fully identifying patient info out until secure mode is on.</div>' +
      '<div class="c"><button class="mic" id="bbai-mic" type="button" aria-label="Talk to Brian" title="Talk to Brian">🎤</button>' +
      '<textarea id="bbai-in" rows="1" placeholder="Ask, talk, or paste notes…" aria-label="Message Brian"></textarea>' +
      '<button class="send" id="bbai-send" type="button">Send</button></div>';
    document.body.appendChild(launcher); document.body.appendChild(scrim); document.body.appendChild(panel);
    bodyEl = panel.querySelector('#bbai-body'); inputEl = panel.querySelector('#bbai-in');
    sendEl = panel.querySelector('#bbai-send'); micEl = panel.querySelector('#bbai-mic'); voiceEl = panel.querySelector('#bbai-voice');

    if (voiceEl && !voiceOn) voiceEl.classList.add('off');
    if (micEl && !SR) micEl.classList.add('hide');  // no speech recognition -> hide mic

    launcher.addEventListener('click', openPanel);
    scrim.addEventListener('click', closePanel);
    panel.querySelector('#bbai-x').addEventListener('click', closePanel);
    panel.querySelector('#bbai-clr').addEventListener('click', function () { thread = []; save(); render(); inputEl.focus(); });
    voiceEl.addEventListener('click', toggleVoice);
    micEl.addEventListener('click', startListen);
    sendEl.addEventListener('click', function () { primeAudio(); send(); });
    inputEl.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); primeAudio(); send(); } });
    inputEl.addEventListener('input', autoGrow);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('on')) closePanel(); });
    render();
  }

  function autoGrow() { inputEl.style.height = 'auto'; inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px'; }
  function openPanel() { panel.classList.add('on'); scrim.classList.add('on'); setTimeout(function () { inputEl.focus(); scrollDown(); }, 60); }
  function closePanel() { panel.classList.remove('on'); scrim.classList.remove('on'); if (recog && listening) { try { recog.stop(); } catch (e) {} } }
  function scrollDown() { if (bodyEl) bodyEl.scrollTop = bodyEl.scrollHeight; }

  function pageName() {
    var k = window.BB_NAV_ACTIVE || '';
    if (k) return String(k);
    var t = (document.title || '').split('—')[0].split('|')[0].trim();
    return t || 'Home';
  }

  // ---- voice out (ElevenLabs "Brian") ----
  function toggleVoice() {
    voiceOn = !voiceOn; saveVoice();
    voiceEl.innerHTML = voiceOn ? '🔊' : '🔇';
    voiceEl.classList.toggle('off', !voiceOn);
    if (voiceOn) primeAudio();
  }
  // iOS unlock: wake the AudioContext + prime a reusable <audio> during a real tap.
  function primeAudio() {
    try { if (!ctx && AC) ctx = new AC(); if (ctx && ctx.state === 'suspended') ctx.resume(); } catch (e) {}
    try {
      if (!audioEl) { audioEl = new Audio(); audioEl.playsInline = true; audioEl.setAttribute('playsinline', ''); }
      audioEl.muted = true; audioEl.src = SILENT;
      var p = audioEl.play();
      if (p && p.then) p.then(function () { try { audioEl.pause(); audioEl.currentTime = 0; } catch (e) {} audioEl.muted = false; }).catch(function () { audioEl.muted = false; });
    } catch (e) {}
  }
  async function speak(text) {
    if (!voiceOn) return;
    var t = plain(text); if (!t) return;
    var buf;
    try {
      var r = await fetch(VOICE_API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: t.slice(0, 1400) }) });
      if (!r.ok) return;
      var ctype = r.headers.get('content-type') || '';
      if (ctype.indexOf('audio') === -1) return; // no_key / error -> stay silent
      buf = await r.arrayBuffer();
    } catch (e) { return; }
    // iOS-safe: decode through the unlocked AudioContext first; fall back to <audio>.
    var played = false;
    if (ctx) {
      try { if (ctx.state === 'suspended') ctx.resume(); } catch (e) {}
      await new Promise(function (resolve) {
        try { ctx.decodeAudioData(buf.slice(0), function (ab) { try { var s = ctx.createBufferSource(); s.buffer = ab; s.connect(ctx.destination); s.start(0); played = true; } catch (e) {} resolve(); }, function () { resolve(); }); }
        catch (e) { resolve(); }
      });
    }
    if (!played) {
      try {
        var url = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }));
        if (!audioEl) { audioEl = new Audio(); audioEl.playsInline = true; }
        audioEl.muted = false; audioEl.src = url;
        var p = audioEl.play(); if (p && p.catch) p.catch(function () {});
        audioEl.onended = function () { try { URL.revokeObjectURL(url); } catch (e) {} };
      } catch (e) {}
    }
  }

  // ---- voice in (on-device speech recognition) ----
  function startListen() {
    primeAudio();
    if (!SR) return;
    if (listening) { if (recog) { try { recog.stop(); } catch (e) {} } return; }
    recog = new SR(); recog.lang = 'en-US'; recog.interimResults = true; recog.continuous = false; recog.maxAlternatives = 1;
    var finalT = '';
    recog.onstart = function () { listening = true; micEl.classList.add('on'); };
    recog.onresult = function (e) {
      var interim = '';
      for (var i = e.resultIndex; i < e.results.length; i++) { var res = e.results[i]; if (res.isFinal) finalT += res[0].transcript; else interim += res[0].transcript; }
      inputEl.value = (finalT + interim).trim(); autoGrow();
    };
    recog.onerror = function () { listening = false; micEl.classList.remove('on'); };
    recog.onend = function () { listening = false; micEl.classList.remove('on'); if (inputEl.value.trim()) send(); };
    try { recog.start(); } catch (e) {}
  }

  function render() {
    if (!thread.length) {
      var chips = CHIPS.map(function (c, i) { return '<button class="chip" data-i="' + i + '" type="button">' + esc(c[0]) + '</button>'; }).join('');
      bodyEl.innerHTML = '<div class="intro"><b>Hey Doc — Brian here.</b><br>Ask me anything: draft a patient note, turn your scribbles into a SOAP, explain a lab, run market research on your tri-county competition, or prep for a North Idaho interview. Tap the 🎤 to talk to me — I\'ll talk back. Hit 🔊 up top if you\'d rather I zip it.<div class="chips">' + chips + '</div></div>';
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
        var reply, spoke = true;
        if (r && r.ok && r.reply) reply = r.reply;
        else if (r && r.reason === 'no_key') { reply = "I'm almost ready — the practice just needs to switch on the AI key in the hub's settings, then I can answer live. (Everything else in your hub already works.)"; spoke = false; }
        else if (r && r.reason === 'net') { reply = "I couldn't reach the server just now. Check your connection and give it another go."; spoke = false; }
        else { reply = "Something hiccupped on my end" + (r && r.message ? ' (' + r.message + ')' : '') + '. Try me again in a sec.'; spoke = false; }
        thread.push({ role: 'assistant', content: reply }); save(); render(); inputEl.focus();
        if (spoke) speak(reply);
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();

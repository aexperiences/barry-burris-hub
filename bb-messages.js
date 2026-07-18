/* bb-messages.js — Barry Burris, NMD · translated patient <-> provider messaging.
   A self-contained slide-in panel (floating launcher) included on the hub (provider)
   and the patient portal (patient). Stores the ORIGINAL text + sender language via
   /api/connect; translates to the READER's language on display (BBTranslate) with a
   🌐 original toggle. Env-gated: if KV isn't configured it shows "coming online".

   ** DEMO / NON-PHI MODE ** until message bodies are encrypted at rest / on a BAA store.
   Identity from window.BB_ME = { role:'provider'|'patient', key, name, lang }.
   Built by Accelerated Experiences, LLC. */
(function () {
  if (window.__bbMsg) return; window.__bbMsg = true;

  var API = '/api/connect';
  function me() {
    var m = window.BB_ME;
    if (m && m.key) return m;
    var patient = /patient/i.test(location.pathname);
    if (patient) {
      var pid = localStorage.getItem('bb_msg_pid'); if (!pid) { pid = 'pt-' + Math.random().toString(36).slice(2, 9); localStorage.setItem('bb_msg_pid', pid); }
      return { role: 'patient', key: pid, name: 'You', lang: localStorage.getItem('bb_lang') || 'en' };
    }
    return { role: 'provider', key: 'provider', name: 'Barry Burris, NMD', lang: 'en' };
  }
  var ME = me();
  var THEME = ME.role === 'patient' ? { c: '#4a6b52', c2: '#3d5a45' } : { c: '#95463f', c2: '#763530' };
  var openKey = null;      // provider: which patient thread is open
  var pollTimer = null, kvOK = null;
  // Provider pages also carry Brian's launcher (#bbai-btn) at right:18px/bottom:20px —
  // stack this button directly above it so the two never overlap. Patient pages have
  // no assistant button today, so the patient launcher keeps its original spot.
  var BTN_BOTTOM = ME.role === 'provider' ? '90px' : '20px';
  var BTN_BOTTOM_MOBILE = ME.role === 'provider' ? 'calc(144px + env(safe-area-inset-bottom))' : 'calc(74px + env(safe-area-inset-bottom))';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function api(doName, args) {
    return fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ do: doName }, args)) })
      .then(function (r) { return r.json(); }).catch(function () { return { ok: false, reason: 'net' }; });
  }

  function css() {
    if (document.getElementById('bbmsg-css')) return;
    var s = document.createElement('style'); s.id = 'bbmsg-css';
    s.textContent = [
      '#bbmsg-btn{position:fixed;right:18px;bottom:' + BTN_BOTTOM + ';z-index:1400;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;',
      'background:linear-gradient(180deg,' + THEME.c + ',' + THEME.c2 + ');color:#fff;font-size:23px;box-shadow:0 8px 24px rgba(40,25,20,.3);display:flex;align-items:center;justify-content:center}',
      '#bbmsg-btn .bdg{position:absolute;top:-3px;right:-3px;min-width:20px;height:20px;border-radius:10px;background:#c9992f;color:#3a2c10;font:700 11px Inter,sans-serif;display:none;align-items:center;justify-content:center;padding:0 5px;border:2px solid #fffdf8}',
      '#bbmsg-btn .bdg.on{display:flex}',
      '@media(max-width:900px){#bbmsg-btn{bottom:' + BTN_BOTTOM_MOBILE + '}}',
      '#bbmsg-scrim{position:fixed;inset:0;z-index:1401;background:rgba(20,14,10,.4);opacity:0;pointer-events:none;transition:opacity .2s}',
      '#bbmsg-scrim.on{opacity:1;pointer-events:auto}',
      '#bbmsg{position:fixed;top:0;right:0;bottom:0;z-index:1402;width:390px;max-width:92vw;background:#fffdf8;border-left:1px solid #e6ddca;',
      'box-shadow:-12px 0 40px rgba(40,25,15,.18);transform:translateX(102%);transition:transform .24s ease;display:flex;flex-direction:column;font-family:Inter,system-ui,-apple-system,sans-serif}',
      '#bbmsg.on{transform:none}',
      '#bbmsg .h{display:flex;align-items:center;gap:10px;padding:14px 16px;background:linear-gradient(180deg,' + THEME.c + ',' + THEME.c2 + ');color:#fff}',
      '#bbmsg .h .t{font-family:Fraunces,Georgia,serif;font-weight:700;font-size:16px}',
      '#bbmsg .h .bk{margin-left:0;background:rgba(255,255,255,.16);border:none;color:#fff;border-radius:8px;padding:5px 9px;cursor:pointer;font-size:13px;display:none}',
      '#bbmsg .h .x{margin-left:auto;background:transparent;border:none;color:#fff;font-size:22px;cursor:pointer;line-height:1}',
      '#bbmsg .demo{background:#fff7e6;border-bottom:1px solid #e7d29a;color:#7a5f22;font-size:11.5px;padding:7px 14px;line-height:1.4}',
      '#bbmsg .body{flex:1;overflow:auto;background:#f7f2e7}',
      '#bbmsg .inbox .row{display:flex;gap:11px;align-items:center;padding:13px 15px;border-bottom:1px solid #ece3d0;cursor:pointer;background:#fffdf8}',
      '#bbmsg .inbox .row:hover{background:#f7f1e4}',
      '#bbmsg .inbox .av{width:40px;height:40px;flex:none;border-radius:50%;background:#efe7d3;color:' + THEME.c + ';font-family:Fraunces,serif;font-weight:700;display:flex;align-items:center;justify-content:center}',
      '#bbmsg .inbox .nm{font-weight:700;font-size:14px;color:#2a2118}',
      '#bbmsg .inbox .lst{font-size:12.5px;color:#8a7d63;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:210px}',
      '#bbmsg .inbox .un{margin-left:auto;min-width:20px;height:20px;border-radius:10px;background:' + THEME.c + ';color:#fff;font:700 11px Inter;display:flex;align-items:center;justify-content:center;padding:0 5px}',
      '#bbmsg .thread{padding:14px;display:flex;flex-direction:column;gap:9px}',
      '#bbmsg .b{max-width:82%;padding:9px 12px;border-radius:13px;font-size:14px;line-height:1.4;position:relative}',
      '#bbmsg .b.them{align-self:flex-start;background:#fff;border:1px solid #e6ddca;color:#2a2118}',
      '#bbmsg .b.me{align-self:flex-end;background:' + THEME.c + ';color:#fff}',
      '#bbmsg .b .cog{border:none;background:none;color:inherit;opacity:.6;font-size:11px;cursor:pointer;padding:0 1px}',
      '#bbmsg .b .who{font-size:10.5px;opacity:.6;margin-bottom:2px;font-weight:600}',
      '#bbmsg .c{display:flex;gap:8px;padding:11px;border-top:1px solid #e6ddca;background:#fffdf8}',
      '#bbmsg .c input{flex:1;border:1px solid #e0d6bf;border-radius:10px;padding:11px 12px;font:inherit;font-size:14px;color:#2a2118}',
      '#bbmsg .c input:focus{outline:none;border-color:#c9992f}',
      '#bbmsg .c button{border:none;border-radius:10px;background:' + THEME.c + ';color:#fff;padding:0 15px;font-weight:700;cursor:pointer}',
      '#bbmsg .empty{padding:34px 22px;text-align:center;color:#8a7d63;font-size:13.5px;line-height:1.5}'
    ].join('');
    document.head.appendChild(s);
  }

  var launcher, panel, scrim;
  function build() {
    css();
    launcher = document.createElement('button'); launcher.id = 'bbmsg-btn'; launcher.type = 'button';
    launcher.setAttribute('aria-label', 'Messages');
    launcher.innerHTML = '💬<span class="bdg" id="bbmsg-bdg"></span>';
    scrim = document.createElement('div'); scrim.id = 'bbmsg-scrim';
    panel = document.createElement('aside'); panel.id = 'bbmsg'; panel.setAttribute('aria-label', 'Messages');
    panel.innerHTML =
      '<div class="h"><button class="bk" id="bbmsg-bk">‹ Inbox</button><div class="t" id="bbmsg-title">Messages</div><button class="x" id="bbmsg-x" aria-label="Close">×</button></div>' +
      '<div class="demo">Demo — please don’t share medical details here yet. Secure messaging goes live after encryption is enabled.</div>' +
      '<div class="body" id="bbmsg-body"></div>' +
      '<div class="c" id="bbmsg-c" style="display:none"><input id="bbmsg-in" placeholder="Type a message…" aria-label="Message"><button id="bbmsg-send" type="button">Send</button></div>';
    document.body.appendChild(launcher); document.body.appendChild(scrim); document.body.appendChild(panel);
    launcher.addEventListener('click', openPanel);
    scrim.addEventListener('click', closePanel);
    panel.querySelector('#bbmsg-x').addEventListener('click', closePanel);
    panel.querySelector('#bbmsg-bk').addEventListener('click', function () { openKey = null; renderInbox(); });
    panel.querySelector('#bbmsg-send').addEventListener('click', send);
    panel.querySelector('#bbmsg-in').addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });
    // provider: poll inbox for unread badge
    if (ME.role === 'provider') { pollInboxBadge(); setInterval(pollInboxBadge, 6000); }
  }

  function openPanel() {
    panel.classList.add('on'); scrim.classList.add('on');
    if (ME.role === 'patient') { openKey = ME.key; renderThread(); } else { openKey = null; renderInbox(); }
  }
  function closePanel() { panel.classList.remove('on'); scrim.classList.remove('on'); if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }

  function setComposer(on) { document.getElementById('bbmsg-c').style.display = on ? 'flex' : 'none'; }
  function setBack(on) { document.getElementById('bbmsg-bk').style.display = on ? 'inline-block' : 'none'; }

  function comingOnline() {
    document.getElementById('bbmsg-body').innerHTML = '<div class="empty"><b>Messaging is finishing setup.</b><br>It switches on as soon as the practice connects its secure server.</div>';
    setComposer(false);
  }

  function renderInbox() {
    setBack(false); setComposer(false);
    document.getElementById('bbmsg-title').textContent = 'Messages';
    var body = document.getElementById('bbmsg-body'); body.className = 'body inbox';
    api('inbox', { role: 'provider' }).then(function (r) {
      if (r && r.reason === 'no_kv') { kvOK = false; comingOnline(); return; }
      kvOK = true;
      var list = (r && r.threads) || [];
      if (!list.length) { body.innerHTML = '<div class="empty">No patient messages yet.<br>When a patient writes, their thread appears here — in your language.</div>'; return; }
      var seen = readSeen();
      body.innerHTML = list.map(function (t) {
        var un = (t.lastRole === 'patient' && (t.lastTs || 0) > (seen[t.key] || 0)) ? '<div class="un">•</div>' : '';
        return '<div class="row" data-k="' + esc(t.key) + '" data-n="' + esc(t.name || t.key) + '"><div class="av">' + esc((t.name || t.key).slice(0, 1).toUpperCase()) + '</div><div style="min-width:0"><div class="nm">' + esc(t.name || t.key) + '</div><div class="lst">' + esc(t.lastText || '') + '</div></div>' + un + '</div>';
      }).join('');
      [].slice.call(body.querySelectorAll('.row')).forEach(function (row) {
        row.addEventListener('click', function () { openKey = row.getAttribute('data-k'); openName = row.getAttribute('data-n'); renderThread(); });
      });
    });
  }

  var openName = '';
  function renderThread() {
    setComposer(true); setBack(ME.role === 'provider');
    document.getElementById('bbmsg-title').textContent = ME.role === 'provider' ? (openName || 'Patient') : 'Barry Burris, NMD';
    var body = document.getElementById('bbmsg-body'); body.className = 'body'; body.innerHTML = '<div class="thread" id="bbmsg-thread"></div>';
    loadThread(true);
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(function () { loadThread(false); }, 4000);
  }

  function loadThread(scroll) {
    api('thread', { with: openKey }).then(function (r) {
      if (r && r.reason === 'no_kv') { kvOK = false; comingOnline(); return; }
      var wrap = document.getElementById('bbmsg-thread'); if (!wrap) return;
      var msgs = (r && r.msgs) || [];
      // mark seen (newest ts)
      if (msgs.length) { var last = msgs[msgs.length - 1].ts; var seen = readSeen(); seen[openKey] = Math.max(seen[openKey] || 0, last); writeSeen(seen); }
      wrap.innerHTML = '';
      var toTranslate = [];
      msgs.forEach(function (m) {
        var mine = m.role === ME.role;
        var div = document.createElement('div'); div.className = 'b ' + (mine ? 'me' : 'them');
        var who = ME.role === 'provider' && !mine ? '' : (mine ? '' : '');
        div.innerHTML = '<span class="ctx">' + esc(m.text) + '</span>';
        wrap.appendChild(div);
        if (!mine && m.text) toTranslate.push({ el: div, text: m.text, lang: m.lang });
      });
      if (scroll) { var b = document.getElementById('bbmsg-body'); b.scrollTop = b.scrollHeight; }
      // translate incoming to reader's language (batch)
      if (toTranslate.length && typeof BBTranslate !== 'undefined') {
        var texts = toTranslate.map(function (x) { return x.text; });
        BBTranslate.batch(texts, ME.lang).then(function (res) {
          toTranslate.forEach(function (x, i) {
            var tr = res && res[i]; if (!tr || tr === x.text) return;
            var span = x.el.querySelector('.ctx'); span.textContent = tr;
            var btn = document.createElement('button'); btn.className = 'cog'; btn.textContent = '🌐'; btn.title = 'original';
            btn.setAttribute('data-o', x.text); btn.setAttribute('data-t', tr); btn.setAttribute('data-s', 't');
            btn.onclick = function () { var s = btn.getAttribute('data-s'); span.textContent = (s === 't') ? btn.getAttribute('data-o') : btn.getAttribute('data-t'); btn.setAttribute('data-s', s === 't' ? 'o' : 't'); };
            x.el.appendChild(document.createTextNode(' ')); x.el.appendChild(btn);
          });
        });
      }
    });
  }

  function send() {
    var inp = document.getElementById('bbmsg-in'); var txt = (inp.value || '').trim(); if (!txt || !openKey) return;
    var args = { role: ME.role, me: ME.key, name: ME.name, lang: ME.lang, text: txt };
    if (ME.role === 'provider') { args.to = openKey; args.patientName = openName || openKey; }
    else { args.to = 'provider'; args.patientName = ME.name; }
    inp.value = '';
    // optimistic bubble
    var wrap = document.getElementById('bbmsg-thread');
    if (wrap) { var div = document.createElement('div'); div.className = 'b me'; div.innerHTML = '<span class="ctx">' + esc(txt) + '</span>'; wrap.appendChild(div); var b = document.getElementById('bbmsg-body'); b.scrollTop = b.scrollHeight; }
    api('send', args).then(function (r) { if (r && r.reason === 'no_kv') comingOnline(); });
  }

  // provider unread badge
  function pollInboxBadge() {
    api('inbox', { role: 'provider' }).then(function (r) {
      if (!r || !r.threads) return;
      var seen = readSeen(), n = 0;
      r.threads.forEach(function (t) { if (t.lastRole === 'patient' && (t.lastTs || 0) > (seen[t.key] || 0)) n++; });
      var bdg = document.getElementById('bbmsg-bdg'); if (!bdg) return;
      if (n > 0) { bdg.textContent = n; bdg.classList.add('on'); } else bdg.classList.remove('on');
    });
  }
  function readSeen() { try { return JSON.parse(localStorage.getItem('bb_msg_seen') || '{}'); } catch (e) { return {}; } }
  function writeSeen(o) { try { localStorage.setItem('bb_msg_seen', JSON.stringify(o)); } catch (e) {} }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();

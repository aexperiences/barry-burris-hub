/* bb-telehealth.js — Barry Burris, NMD · REAL video visits (shared)
   -----------------------------------------------------------------
   Drop-in live telehealth for the hub. Uses the Jitsi Meet external API for
   real peer-to-peer audio/video (NAT traversal + TURN included, no account,
   no backend). The SAME room is derived from the patient's name on both sides,
   so the patient (portal) and the provider (hub) land in the same visit.

   Public API:
     BBTele.open({ displayName, patient, subject, room, onClose })
     BBTele.roomFor(patientName)   -> deterministic room id shared by both sides
     BBTele.close()
     BBTele.isOpen()

   GO-LIVE NOTE: HOST is a single constant. Before real patient visits, point it
   at a HIPAA-eligible video vendor (Zoom for Healthcare / Twilio Video / a
   self-hosted Jitsi under a BAA) — nothing else here changes. See the
   "HIPAA Go-Live Plan". Built by Accelerated Experiences, LLC.
*/
(function () {
  'use strict';
  var HOST = 'meet.jit.si';     // <— swap to your BAA video vendor at go-live
  var PREFIX = 'BBNMD';         // room namespace (keeps our rooms distinct)
  var api = null, overlay = null, onCloseCb = null, scriptLoading = false, _myLang = 'en';

  function slug(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
  }
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); }
  function clean(n) { return String(n || '').replace(/\s*\(SAMPLE\)\s*/i, '').trim(); }
  function roomFor(name) { var c = clean(name); var n = slug(c) || 'patient'; return PREFIX + '-' + n + '-' + hash(PREFIX + ':' + c); }
  // Barry's always-on "office" room — a fixed shared room for a direct call right now.
  function officeRoom() { return PREFIX + '-office-' + hash(PREFIX + ':office:barry-burris-nmd'); }

  var COIN = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20100%20100'%3E%3Cdefs%3E%3ClinearGradient%20id='g'%20x1='0'%20y1='0'%20x2='0'%20y2='1'%3E%3Cstop%20offset='0'%20stop-color='%23f4e0a6'/%3E%3Cstop%20offset='.5'%20stop-color='%23c6a04a'/%3E%3Cstop%20offset='1'%20stop-color='%238f6f2e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle%20cx='50'%20cy='50'%20r='49'%20fill='%230e1d30'/%3E%3Ccircle%20cx='50'%20cy='50'%20r='45'%20fill='none'%20stroke='url(%23g)'%20stroke-width='2.4'/%3E%3Ctext%20x='50'%20y='64'%20font-family='Georgia,serif'%20font-size='41'%20font-weight='700'%20fill='url(%23g)'%20text-anchor='middle'%3EBB%3C/text%3E%3C/svg%3E";

  function css() {
    if (document.getElementById('bbtele-css')) return;
    var s = document.createElement('style'); s.id = 'bbtele-css';
    s.textContent = [
      '#bbtele{position:fixed;inset:0;z-index:5000;background:#0c1116;display:none;flex-direction:column}',
      '#bbtele.on{display:flex}',
      '#bbtele .tbar{display:flex;align-items:center;gap:11px;padding:10px 16px;color:#e7edf2;border-bottom:1px solid #1d2630;background:#0a0f14}',
      '#bbtele .tbar img{width:30px;height:30px;border-radius:50%}',
      '#bbtele .tt{font-family:Fraunces,Georgia,serif;font-weight:700;font-size:15px;color:#fff;line-height:1.1}',
      '#bbtele .ts{font-size:11px;color:#8ea1b2}',
      '#bbtele .note{margin-left:auto;font-size:11px;color:#9fb0bf;background:#12202a;border:1px solid #1d2630;border-radius:99px;padding:5px 12px;max-width:52%;text-align:center}',
      '#bbtele .leave{margin-left:10px;border:1px solid #7a2a24;background:#b3261e;color:#fff;border-radius:9px;padding:8px 14px;font:inherit;font-weight:700;cursor:pointer;font-family:Inter,system-ui,sans-serif}',
      '#bbtele .leave:hover{filter:brightness(1.08)}',
      '#bbtele .stage{flex:1;position:relative;background:#0c1116}',
      '#bbtele .stage iframe{width:100%;height:100%;border:0}',
      '#bbtele .msg{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#aeb9c4;gap:12px;text-align:center;padding:24px}',
      '#bbtele .msg .sp{width:26px;height:26px;border:3px solid rgba(230,198,126,.3);border-top-color:#e6c67e;border-radius:50%;animation:bbtsp 1s linear infinite}',
      '@keyframes bbtsp{to{transform:rotate(360deg)}}',
      '#bbtele .msg button{border:1px solid #2a3742;background:#18222b;color:#e7edf2;border-radius:9px;padding:9px 15px;font:inherit;cursor:pointer;font-family:Inter,system-ui,sans-serif}',
      '#bbtele .tbar .chatbtn{margin-left:8px;border:1px solid #2a3742;background:#18222b;color:#dfe7ee;border-radius:9px;padding:8px 12px;font:inherit;font-weight:600;cursor:pointer;font-family:Inter,system-ui,sans-serif}',
      '#bbtele .tbar .chatbtn.on{background:#31696a;border-color:#31696a;color:#fff}',
      '#bbtele .tbar .chatbtn.pulse{animation:bbtpulse 1.1s ease-in-out infinite}',
      '@keyframes bbtpulse{0%,100%{box-shadow:0 0 0 0 rgba(230,198,126,.5)}50%{box-shadow:0 0 0 6px rgba(230,198,126,0)}}',
      '#bbtele .body{flex:1;display:flex;min-height:0}',
      '#bbtele .chat{width:322px;flex:none;border-left:1px solid #1d2630;background:#0a0f14;display:flex;flex-direction:column;color:#e7edf2}',
      '#bbtele .chat .ch-h{padding:11px 14px;border-bottom:1px solid #1d2630;font-size:11.5px;font-weight:700;color:#9fb0bf;text-transform:uppercase;letter-spacing:.08em}',
      '#bbtele .chat .ch-b{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:8px}',
      '#bbtele .chat .cmsg{max-width:88%;padding:8px 11px;border-radius:12px;font-size:13.5px;line-height:1.4}',
      '#bbtele .chat .cmsg.them{align-self:flex-start;background:#18232c;border:1px solid #263440}',
      '#bbtele .chat .cmsg.me{align-self:flex-end;background:#31696a;color:#fff}',
      '#bbtele .chat .cog{border:none;background:none;color:inherit;opacity:.62;font-size:11px;cursor:pointer;padding:0 2px}',
      '#bbtele .chat .ch-c{display:flex;gap:7px;padding:10px;border-top:1px solid #1d2630}',
      '#bbtele .chat .ch-c input{flex:1;background:#131c24;border:1px solid #26323d;border-radius:9px;color:#fff;padding:9px 11px;font:inherit;font-size:13px}',
      '#bbtele .chat .ch-c button{border:none;background:#31696a;color:#fff;border-radius:9px;padding:0 14px;font-weight:700;cursor:pointer}',
      '@media(max-width:640px){#bbtele .chat{position:absolute;right:0;top:0;bottom:0;width:86%;z-index:5}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function ensureOverlay(opts) {
    css();
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'bbtele';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Telehealth visit');
      overlay.innerHTML =
        '<div class="tbar"><img src="' + COIN + '" alt=""><div><div class="tt">Telehealth visit</div><div class="ts" id="bbtele-sub">Barry Burris, NMD</div></div>' +
        '<div class="note" id="bbtele-note"></div>' +
        '<button class="chatbtn" id="bbtele-chatbtn" type="button">💬 Chat</button>' +
        '<button class="leave" id="bbtele-leave">Leave visit</button></div>' +
        '<div class="body"><div class="stage" id="bbtele-stage"></div>' +
        '<div class="chat" id="bbtele-chat" style="display:none"><div class="ch-h">Live chat · translated</div><div class="ch-b" id="bbtele-chatb"></div><div class="ch-c"><input id="bbtele-chatin" placeholder="Type a message…" aria-label="Chat message"><button id="bbtele-chatsend" type="button">Send</button></div></div>' +
        '</div>';
      document.body.appendChild(overlay);
      overlay.querySelector('#bbtele-leave').addEventListener('click', close);
      overlay.querySelector('#bbtele-chatbtn').addEventListener('click', toggleChat);
      overlay.querySelector('#bbtele-chatsend').addEventListener('click', sendChat);
      overlay.querySelector('#bbtele-chatin').addEventListener('keydown', function (e) { if (e.key === 'Enter') sendChat(); });
    }
    overlay.querySelector('#bbtele-sub').textContent = opts.subject || 'Barry Burris, NMD';
    overlay.querySelector('#bbtele-note').textContent = opts.note || 'Live video visit.';
    document.getElementById('bbtele-stage').innerHTML = '';
    var _cb = document.getElementById('bbtele-chatb'); if (_cb) _cb.innerHTML = '';
    var _cp = document.getElementById('bbtele-chat'); if (_cp) _cp.style.display = 'none';
    var _cbtn = document.getElementById('bbtele-chatbtn'); if (_cbtn) _cbtn.classList.remove('on', 'pulse');
    overlay.classList.add('on');
  }

  function stageMsg(html, withRetry, retryFn) {
    var st = document.getElementById('bbtele-stage'); if (!st) return;
    st.innerHTML = '<div class="msg">' + html + (withRetry ? '<button id="bbtele-retry">Try again</button>' : '') + '</div>';
    if (withRetry) { var b = document.getElementById('bbtele-retry'); if (b && retryFn) b.addEventListener('click', retryFn); }
  }

  function loadScript(cb) {
    if (window.JitsiMeetExternalAPI) return cb();
    var existing = document.getElementById('bbtele-api');
    if (existing && scriptLoading) { existing.addEventListener('load', function () { cb(); }); return; }
    scriptLoading = true;
    var sc = document.createElement('script'); sc.id = 'bbtele-api'; sc.async = true;
    sc.src = 'https://' + HOST + '/external_api.js';
    sc.onload = function () { scriptLoading = false; cb(); };
    sc.onerror = function () { scriptLoading = false; cb(new Error('load')); };
    document.head.appendChild(sc);
  }

  function start(opts, room) {
    stageMsg('<div class="sp"></div><div>Connecting to your visit…</div>');
    loadScript(function (err) {
      if (err || !window.JitsiMeetExternalAPI) {
        stageMsg('<div>We couldn’t reach the video service.<br>Check your connection and try again.</div>', true, function () { start(opts, room); });
        return;
      }
      try {
        document.getElementById('bbtele-stage').innerHTML = '';
        api = new window.JitsiMeetExternalAPI(HOST, {
          roomName: room,
          parentNode: document.getElementById('bbtele-stage'),
          width: '100%', height: '100%',
          userInfo: { displayName: opts.displayName || 'Patient' },
          configOverwrite: {
            prejoinPageEnabled: true,
            disableDeepLinking: true,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            subject: opts.subject || 'Telehealth visit — Barry Burris, NMD'
          },
          interfaceConfigOverwrite: {
            MOBILE_APP_PROMO: false,
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_CHROME_EXTENSION_BANNER: false,
            HIDE_DEEP_LINKING_LOGO: true,
            DISABLE_VIDEO_BACKGROUND: false,
            TOOLBAR_BUTTONS: ['microphone', 'camera', 'desktop', 'raisehand', 'tileview', 'settings', 'fullscreen', 'hangup']
          }
        });
        api.addListener('readyToClose', close);
        api.addListener('videoConferenceLeft', function () { setTimeout(close, 300); });
        api.addListener('incomingMessage', function (ev) { var msg = ev && (ev.message || ev.text) || ''; if (msg) addChatBubble('them', msg, (ev && ev.nick) || ''); });
      } catch (e) {
        stageMsg('<div>Video failed to start.<br><span style="font-size:12px;opacity:.7">' + (e && e.message ? String(e.message) : '') + '</span></div>', true, function () { start(opts, room); });
      }
    });
  }

  function open(opts) {
    opts = opts || {};
    var room = opts.room || roomFor(opts.patient || opts.displayName || 'test');
    onCloseCb = opts.onClose || null;
    _myLang = opts.myLang || 'en';
    ensureOverlay(opts);
    start(opts, room);
    return room;
  }

  function close() {
    if (api) { try { api.dispose(); } catch (e) {} api = null; }
    if (overlay) overlay.classList.remove('on');
    if (onCloseCb) { var c = onCloseCb; onCloseCb = null; try { c(); } catch (e) {} }
  }
  function isOpen() { return !!(overlay && overlay.classList.contains('on')); }

  // ---- in-call translated text chat (over Jitsi chat channel) ----
  function _esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function addChatBubble(side, text) {
    var b = document.getElementById('bbtele-chatb'); if (!b) return;
    var id = 'bc' + Date.now() + Math.floor(Math.random() * 1e4);
    var div = document.createElement('div'); div.className = 'cmsg ' + side; div.id = id;
    div.innerHTML = '<span class="ctx">' + _esc(text) + '</span>';
    b.appendChild(div); b.scrollTop = b.scrollHeight;
    var panel = document.getElementById('bbtele-chat');
    if (side === 'them' && panel && panel.style.display === 'none') { var cb = document.getElementById('bbtele-chatbtn'); if (cb) cb.classList.add('pulse'); }
    if (side === 'them' && typeof BBTranslate !== 'undefined' && _myLang) {
      BBTranslate.to(text, _myLang).then(function (tr) {
        var el = document.getElementById(id); if (!el) return;
        if (tr && tr !== text) {
          var span = el.querySelector('.ctx'); span.textContent = tr;
          var btn = document.createElement('button'); btn.className = 'cog'; btn.textContent = '🌐'; btn.title = 'original';
          btn.setAttribute('data-o', text); btn.setAttribute('data-t', tr); btn.setAttribute('data-s', 't');
          btn.onclick = function () { var s = btn.getAttribute('data-s'); span.textContent = (s === 't') ? btn.getAttribute('data-o') : btn.getAttribute('data-t'); btn.setAttribute('data-s', s === 't' ? 'o' : 't'); };
          el.appendChild(document.createTextNode(' ')); el.appendChild(btn);
        }
      });
    }
  }
  function sendChat() {
    var inp = document.getElementById('bbtele-chatin'); if (!inp) return;
    var txt = (inp.value || '').trim(); if (!txt) return;
    if (api) { try { api.executeCommand('sendChatMessage', txt); } catch (e) {} }
    addChatBubble('me', txt); inp.value = '';
  }
  function toggleChat() {
    var c = document.getElementById('bbtele-chat'); if (!c) return;
    var show = c.style.display === 'none'; c.style.display = show ? 'flex' : 'none';
    var cb = document.getElementById('bbtele-chatbtn'); if (cb) { cb.classList.toggle('on', show); cb.classList.remove('pulse'); }
    if (show) { var i = document.getElementById('bbtele-chatin'); if (i) i.focus(); }
  }

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen()) close(); });

  window.BBTele = { open: open, close: close, roomFor: roomFor, officeRoom: officeRoom, OFFICE: officeRoom(), isOpen: isOpen, HOST: HOST };
})();

/* bb-rtc.js — Barry Burris, NMD · NATIVE video visits (own WebRTC, no third party).
   -----------------------------------------------------------------------------
   Drop-in replacement for bb-telehealth.js. SAME public API (window.BBTele), same
   full-screen overlay + translated in-call chat — but the media is the browser's
   own WebRTC, meshed peer-to-peer, signaled through the hub's /api/connect (KV).
   No Jitsi, no Zoom, no accounts, no media server. Media is P2P (patient <-> provider
   directly) => strong for HIPAA; only SDP/ICE (no PHI) crosses the signaling relay.

   Public API (unchanged, so nothing that launches video must change):
     BBTele.open({ room, patient, displayName, subject, note, onClose, myLang, outreach })
     BBTele.roomFor(patientName)  BBTele.officeRoom()  BBTele.inviteURL(room)
     BBTele.close()  BBTele.isOpen()  BBTele.NATIVE === true

   GO-LIVE: add a TURN server for reliability (a dropped visit is a clinical problem):
     window.BB_TURN = { urls:'turn:HOST:3478', username:'U', credential:'C' };  // before this script
   Built by Accelerated Experiences, LLC. */
(function () {
  'use strict';
  var PREFIX = 'BBNMD';
  var API = '/api/connect';
  var POLL_MS = 1500;

  function ice() {
    var s = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' }];
    if (window.BB_TURN) s.push(window.BB_TURN);
    return s;
  }

  var overlay = null, onCloseCb = null, _myLang = 'en';
  var S = null; // active session state

  function slug(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase(); }
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); }
  function clean(n) { return String(n || '').replace(/\s*\(SAMPLE\)\s*/i, '').trim(); }
  function roomFor(name) { var c = clean(name); var n = slug(c) || 'patient'; return PREFIX + '-' + n + '-' + hash(PREFIX + ':' + c); }
  function officeRoom() { return PREFIX + '-office-' + hash(PREFIX + ':office:barry-burris-nmd'); }
  function inviteURL(room) { return location.origin + '/bb-meet.html?room=' + encodeURIComponent(room || officeRoom()); }
  function _esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

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
      '#bbtele .note{margin-left:auto;font-size:11px;color:#9fb0bf;background:#12202a;border:1px solid #1d2630;border-radius:99px;padding:5px 12px;max-width:46%;text-align:center}',
      '#bbtele .chatbtn{margin-left:8px;border:1px solid #2a3742;background:#18222b;color:#dfe7ee;border-radius:9px;padding:8px 12px;font:inherit;font-weight:600;cursor:pointer;font-family:Inter,system-ui,sans-serif}',
      '#bbtele .chatbtn.on{background:#31696a;border-color:#31696a;color:#fff}',
      '#bbtele .chatbtn.pulse{animation:bbtpulse 1.1s ease-in-out infinite}',
      '@keyframes bbtpulse{0%,100%{box-shadow:0 0 0 0 rgba(230,198,126,.5)}50%{box-shadow:0 0 0 6px rgba(230,198,126,0)}}',
      '#bbtele .leave{margin-left:10px;border:1px solid #7a2a24;background:#b3261e;color:#fff;border-radius:9px;padding:8px 14px;font:inherit;font-weight:700;cursor:pointer;font-family:Inter,system-ui,sans-serif}',
      '#bbtele .leave:hover{filter:brightness(1.08)}',
      '#bbtele .body{flex:1;display:flex;min-height:0}',
      '#bbtele .stagewrap{flex:1;display:flex;flex-direction:column;min-width:0;background:#0c1116}',
      '#bbtele .stage{flex:1;position:relative;display:grid;gap:10px;padding:14px;grid-template-columns:1fr;align-content:center;justify-items:center}',
      '#bbtele .stage.n2{grid-template-columns:1fr 1fr}',
      '#bbtele .stage.n3,#bbtele .stage.n4{grid-template-columns:1fr 1fr}',
      '#bbtele .tile{position:relative;width:100%;height:100%;max-height:100%;background:#0a1219;border:1px solid #1d2630;border-radius:14px;overflow:hidden;display:flex;align-items:center;justify-content:center}',
      '#bbtele .tile video{width:100%;height:100%;object-fit:cover;background:#0a1219}',
      '#bbtele .tile .nm{position:absolute;left:10px;bottom:9px;background:rgba(6,12,18,.66);color:#e7edf2;font:600 12px Inter,system-ui,sans-serif;padding:3px 10px;border-radius:8px}',
      '#bbtele .tile .ph{color:#5f7385;font:600 14px Inter,sans-serif;display:flex;flex-direction:column;align-items:center;gap:8px}',
      '#bbtele .tile .ph .av{width:64px;height:64px;border-radius:50%;background:#16232e;display:flex;align-items:center;justify-content:center;font-family:Fraunces,serif;font-size:24px;color:#c6a04a}',
      '#bbtele .ctrls{display:flex;align-items:center;justify-content:center;gap:12px;padding:12px;background:#0a0f14;border-top:1px solid #1d2630}',
      '#bbtele .ctrls button{width:52px;height:52px;border-radius:50%;border:1px solid #2a3742;background:#18222b;color:#e7edf2;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:filter .12s}',
      '#bbtele .ctrls button:hover{filter:brightness(1.15)}',
      '#bbtele .ctrls button.off{background:#b3261e;border-color:#7a2a24;color:#fff}',
      '#bbtele .msg{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#aeb9c4;gap:12px;text-align:center;padding:24px}',
      '#bbtele .msg .sp{width:26px;height:26px;border:3px solid rgba(230,198,126,.3);border-top-color:#e6c67e;border-radius:50%;animation:bbtsp 1s linear infinite}',
      '@keyframes bbtsp{to{transform:rotate(360deg)}}',
      '#bbtele .msg button{border:1px solid #2a3742;background:#18222b;color:#e7edf2;border-radius:9px;padding:9px 15px;font:inherit;cursor:pointer;font-family:Inter,system-ui,sans-serif}',
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
      '@media(max-width:640px){#bbtele .chat{position:absolute;right:0;top:0;bottom:0;width:86%;z-index:5}#bbtele .note{display:none}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function ensureOverlay(opts) {
    css();
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'bbtele';
      overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-label', 'Telehealth visit');
      overlay.innerHTML =
        '<div class="tbar"><img src="' + COIN + '" alt=""><div><div class="tt">Video visit</div><div class="ts" id="bbtele-sub">Barry Burris, NMD</div></div>' +
        '<div class="note" id="bbtele-note"></div>' +
        '<button class="chatbtn" id="bbtele-chatbtn" type="button">💬 Chat</button>' +
        '<button class="leave" id="bbtele-leave" type="button">Leave visit</button></div>' +
        '<div class="body">' +
        '<div class="stagewrap"><div class="stage" id="bbtele-stage"></div>' +
        '<div class="ctrls" id="bbtele-ctrls" style="display:none">' +
        '<button id="bbtele-mic" title="Mute" aria-label="Mute microphone">🎙️</button>' +
        '<button id="bbtele-cam" title="Camera" aria-label="Toggle camera">🎥</button>' +
        '<button id="bbtele-share" title="Share screen" aria-label="Share screen">🖥️</button>' +
        '</div></div>' +
        '<div class="chat" id="bbtele-chat" style="display:none"><div class="ch-h">Live chat · translated</div><div class="ch-b" id="bbtele-chatb"></div><div class="ch-c"><input id="bbtele-chatin" placeholder="Type a message…" aria-label="Chat message"><button id="bbtele-chatsend" type="button">Send</button></div></div>' +
        '</div>';
      document.body.appendChild(overlay);
      overlay.querySelector('#bbtele-leave').addEventListener('click', close);
      overlay.querySelector('#bbtele-chatbtn').addEventListener('click', toggleChat);
      overlay.querySelector('#bbtele-chatsend').addEventListener('click', sendChat);
      overlay.querySelector('#bbtele-chatin').addEventListener('keydown', function (e) { if (e.key === 'Enter') sendChat(); });
      overlay.querySelector('#bbtele-mic').addEventListener('click', toggleMic);
      overlay.querySelector('#bbtele-cam').addEventListener('click', toggleCam);
      overlay.querySelector('#bbtele-share').addEventListener('click', toggleShare);
    }
    overlay.querySelector('#bbtele-sub').textContent = opts.subject || 'Barry Burris, NMD';
    overlay.querySelector('#bbtele-note').textContent = opts.note || 'Native video · private peer-to-peer.';
    document.getElementById('bbtele-stage').innerHTML = '';
    document.getElementById('bbtele-ctrls').style.display = 'none';
    var _cb = document.getElementById('bbtele-chatb'); if (_cb) _cb.innerHTML = '';
    var _cp = document.getElementById('bbtele-chat'); if (_cp) _cp.style.display = 'none';
    var _cbtn = document.getElementById('bbtele-chatbtn'); if (_cbtn) _cbtn.classList.remove('on', 'pulse');
    overlay.classList.add('on');
  }
  function stageMsg(html, withRetry, retryFn) {
    var st = document.getElementById('bbtele-stage'); if (!st) return;
    st.style.display = 'block';
    st.innerHTML = '<div class="msg">' + html + (withRetry ? '<button id="bbtele-retry">Try again</button>' : '') + '</div>';
    if (withRetry) { var b = document.getElementById('bbtele-retry'); if (b && retryFn) b.addEventListener('click', retryFn); }
  }

  function api(doName, args) {
    return fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ do: doName }, args)) })
      .then(function (r) { return r.json(); }).catch(function () { return { ok: false, reason: 'net' }; });
  }

  // ---------- video tiles ----------
  function renderTiles() {
    var st = document.getElementById('bbtele-stage'); if (!st || !S) return;
    st.style.display = 'grid';
    var ids = ['local'].concat(Object.keys(S.pcs));
    st.className = 'stage n' + Math.min(ids.length, 4);
    // local
    tile('local', S.myName + ' (you)', S.localStream, true);
    // remotes
    Object.keys(S.pcs).forEach(function (pid) { tile(pid, S.pcs[pid].name || 'Guest', S.pcs[pid].stream, false); });
    // remove tiles for peers that left
    [].slice.call(st.querySelectorAll('.tile')).forEach(function (el) {
      var id = el.getAttribute('data-p'); if (id !== 'local' && !S.pcs[id]) el.remove();
    });
  }
  function tile(id, name, stream, muted) {
    var st = document.getElementById('bbtele-stage'); if (!st) return;
    var el = st.querySelector('.tile[data-p="' + id + '"]');
    if (!el) {
      el = document.createElement('div'); el.className = 'tile'; el.setAttribute('data-p', id);
      el.innerHTML = '<video autoplay playsinline' + (muted ? ' muted' : '') + '></video><div class="nm"></div>';
      st.appendChild(el);
    }
    el.querySelector('.nm').textContent = name;
    var v = el.querySelector('video');
    if (stream && v.srcObject !== stream) { v.srcObject = stream; }
    if (!stream) { el.querySelector('.nm').textContent = name; }
  }

  // ---------- peer connections (mesh) ----------
  function makePC(pid, name) {
    var pc = new RTCPeerConnection({ iceServers: ice() });
    var rec = { pc: pc, name: name || 'Guest', stream: new MediaStream(), iceQ: [], haveRemote: false };
    S.pcs[pid] = rec;
    if (S.localStream) S.localStream.getTracks().forEach(function (t) { pc.addTrack(t, S.localStream); });
    pc.onicecandidate = function (e) { if (e.candidate) api('rtcSignal', { room: S.room, from: S.peerId, to: pid, data: { kind: 'ice', c: e.candidate } }); };
    pc.ontrack = function (e) { (e.streams[0] ? e.streams[0].getTracks() : [e.track]).forEach(function (t) { if (rec.stream.getTracks().indexOf(t) < 0) rec.stream.addTrack(t); }); renderTiles(); };
    pc.onconnectionstatechange = function () { if (pc.connectionState === 'failed' || pc.connectionState === 'closed') removePeer(pid); };
    return rec;
  }
  function removePeer(pid) { var r = S && S.pcs[pid]; if (!r) return; try { r.pc.close(); } catch (e) {} delete S.pcs[pid]; renderTiles(); }

  function offerTo(pid, name) {
    var rec = S.pcs[pid] || makePC(pid, name);
    rec.pc.createOffer().then(function (o) { return rec.pc.setLocalDescription(o); })
      .then(function () { api('rtcSignal', { room: S.room, from: S.peerId, to: pid, data: { kind: 'offer', sdp: rec.pc.localDescription } }); });
  }
  function onSignal(m) {
    var from = m.from, d = m.data || {};
    if (d.kind === 'chat') { addChatBubble('them', d.text || ''); return; }
    var rec = S.pcs[from] || makePC(from, m.name);
    var pc = rec.pc;
    if (d.kind === 'offer') {
      pc.setRemoteDescription(new RTCSessionDescription(d.sdp)).then(function () {
        rec.haveRemote = true; flushIce(rec);
        return pc.createAnswer();
      }).then(function (a) { return pc.setLocalDescription(a); })
        .then(function () { api('rtcSignal', { room: S.room, from: S.peerId, to: from, data: { kind: 'answer', sdp: pc.localDescription } }); });
    } else if (d.kind === 'answer') {
      pc.setRemoteDescription(new RTCSessionDescription(d.sdp)).then(function () { rec.haveRemote = true; flushIce(rec); });
    } else if (d.kind === 'ice' && d.c) {
      if (rec.haveRemote) { pc.addIceCandidate(new RTCIceCandidate(d.c)).catch(function () {}); }
      else rec.iceQ.push(d.c);
    }
  }
  function flushIce(rec) { rec.iceQ.splice(0).forEach(function (c) { rec.pc.addIceCandidate(new RTCIceCandidate(c)).catch(function () {}); }); }

  // ---------- poll loop ----------
  function pollLoop() {
    if (!S) return;
    api('rtcPoll', { room: S.room, peer: S.peerId, name: S.myName }).then(function (res) {
      if (!S) return;
      if (res && res.ok) {
        (res.msgs || []).forEach(onSignal);
        var live = {};
        (res.peers || []).forEach(function (p) {
          live[p.id] = 1;
          if (!S.pcs[p.id]) { // new peer: smaller id offers (kills glare)
            if (S.peerId < p.id) offerTo(p.id, p.name); else makePC(p.id, p.name);
          } else if (p.name && S.pcs[p.id].name !== p.name) { S.pcs[p.id].name = p.name; }
        });
        Object.keys(S.pcs).forEach(function (pid) { if (!live[pid]) removePeer(pid); });
        renderTiles();
      }
      S.timer = setTimeout(pollLoop, POLL_MS);
    });
  }

  // ---------- open / close ----------
  function open(opts) {
    opts = opts || {};
    var room = opts.room || roomFor(opts.patient || opts.displayName || 'test');
    onCloseCb = opts.onClose || null;
    _myLang = opts.myLang || 'en';
    ensureOverlay(opts);
    var myName = opts.displayName || opts.patient || 'Guest';
    stageMsg('<div class="sp"></div><div>Starting your visit…</div>');
    // 1) probe backend (env-gated). If KV not configured, video is dormant.
    api('ping', {}).then(function (pong) {
      if (!pong || pong.reason === 'no_kv') {
        stageMsg('<div style="font-size:15px;color:#e7edf2">Video is finishing setup.</div><div style="max-width:420px">Native video switches on as soon as the practice connects its secure server. Your visit link is saved — please try again shortly.</div>');
        return;
      }
      startMedia(room, myName);
    });
    return room;
  }
  function startMedia(room, myName) {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(function (stream) {
      S = { room: room, peerId: 'p' + Math.random().toString(36).slice(2, 9) + hash(String(Date.now())), myName: myName, localStream: stream, pcs: {}, timer: null, camOn: true, micOn: true, screen: null };
      document.getElementById('bbtele-ctrls').style.display = 'flex';
      renderTiles();
      api('rtcJoin', { room: room, peer: S.peerId, name: myName }).then(function (res) {
        if (!S) return;
        if (res && res.ok) { (res.peers || []).forEach(function (p) { if (S.peerId < p.id) offerTo(p.id, p.name); else makePC(p.id, p.name); }); renderTiles(); }
        S.timer = setTimeout(pollLoop, POLL_MS);
      });
    }).catch(function (err) {
      stageMsg('<div>We couldn’t access your camera or microphone.</div><div style="font-size:12px;opacity:.75">' + _esc(err && err.name || '') + ' — check your browser permissions.</div>', true, function () { startMedia(room, myName); });
    });
  }
  function close() {
    if (S) {
      if (S.timer) clearTimeout(S.timer);
      try { api('rtcLeave', { room: S.room, peer: S.peerId }); } catch (e) {}
      Object.keys(S.pcs).forEach(function (pid) { try { S.pcs[pid].pc.close(); } catch (e) {} });
      if (S.localStream) S.localStream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} });
      if (S.screen) S.screen.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} });
      S = null;
    }
    if (overlay) overlay.classList.remove('on');
    if (onCloseCb) { var c = onCloseCb; onCloseCb = null; try { c(); } catch (e) {} }
  }
  function isOpen() { return !!(overlay && overlay.classList.contains('on')); }

  // ---------- controls ----------
  function toggleMic() { if (!S || !S.localStream) return; S.micOn = !S.micOn; S.localStream.getAudioTracks().forEach(function (t) { t.enabled = S.micOn; }); document.getElementById('bbtele-mic').classList.toggle('off', !S.micOn); }
  function toggleCam() { if (!S || !S.localStream) return; S.camOn = !S.camOn; S.localStream.getVideoTracks().forEach(function (t) { t.enabled = S.camOn; }); document.getElementById('bbtele-cam').classList.toggle('off', !S.camOn); }
  function toggleShare() {
    if (!S) return;
    if (S.screen) { stopShare(); return; }
    navigator.mediaDevices.getDisplayMedia({ video: true }).then(function (ds) {
      S.screen = ds; var track = ds.getVideoTracks()[0];
      Object.keys(S.pcs).forEach(function (pid) { var sender = S.pcs[pid].pc.getSenders().find(function (se) { return se.track && se.track.kind === 'video'; }); if (sender) sender.replaceTrack(track); });
      var lv = document.querySelector('#bbtele .tile[data-p="local"] video'); if (lv) lv.srcObject = ds;
      track.onended = stopShare; document.getElementById('bbtele-share').classList.add('off');
    }).catch(function () {});
  }
  function stopShare() {
    if (!S || !S.screen) return;
    var camTrack = S.localStream.getVideoTracks()[0];
    Object.keys(S.pcs).forEach(function (pid) { var sender = S.pcs[pid].pc.getSenders().find(function (se) { return se.track && se.track.kind === 'video'; }); if (sender && camTrack) sender.replaceTrack(camTrack); });
    S.screen.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} }); S.screen = null;
    var lv = document.querySelector('#bbtele .tile[data-p="local"] video'); if (lv) lv.srcObject = S.localStream;
    document.getElementById('bbtele-share').classList.remove('off');
  }

  // ---------- translated in-call chat (relayed via signaling) ----------
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
    var inp = document.getElementById('bbtele-chatin'); if (!inp || !S) return;
    var txt = (inp.value || '').trim(); if (!txt) return;
    Object.keys(S.pcs).forEach(function (pid) { api('rtcSignal', { room: S.room, from: S.peerId, to: pid, data: { kind: 'chat', text: txt } }); });
    addChatBubble('me', txt); inp.value = '';
  }
  function toggleChat() {
    var c = document.getElementById('bbtele-chat'); if (!c) return;
    var show = c.style.display === 'none'; c.style.display = show ? 'flex' : 'none';
    var cb = document.getElementById('bbtele-chatbtn'); if (cb) { cb.classList.toggle('on', show); cb.classList.remove('pulse'); }
    if (show) { var i = document.getElementById('bbtele-chatin'); if (i) i.focus(); }
  }

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen()) close(); });

  window.BBTele = { open: open, close: close, roomFor: roomFor, officeRoom: officeRoom, inviteURL: inviteURL, OFFICE: officeRoom(), isOpen: isOpen, NATIVE: true };
})();

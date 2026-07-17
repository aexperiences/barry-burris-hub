/* bb-checkins.js — Barry Burris, NMD · "Check-Ins": async video between visits.
   The async lane of Barry Connect. A patient records a short video check-in; the provider
   watches and replies whenever. One thread per patient; items are video or text, either side.

   Talks to /api/checkins (KV, env-gated). Region-gated via BBRegion: LIVE for International
   patients; the US path stays behind "secure mode" until HIPAA encryption + BAA are on.

   Embed:  <div id="bb-checkins"></div>            (auto-mounts from window.BB_ME)
   or:     BBCheckins.mount(el, {role, patientKey, patientName, lang, region})

   Palette follows the page: patient = SAGE, staff = clay/RED.
   Decision support / care tool — not for emergencies. Built by Accelerated Experiences, LLC. */
(function () {
  if (window.BBCheckins) return;

  var API = '/api/checkins';
  var CAP_MS = 30000;                 // 30-second cap per check-in
  var MAX_B64 = 5600000;              // ~5.6 MB base64 guard (server caps at 6 MB)

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function api(doName, args) {
    return fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ do: doName }, args)) })
      .then(function (r) { return r.json(); }).catch(function () { return { ok: false, reason: 'net' }; });
  }
  function fmtTime(ts) { try { return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } }
  function fmtDur(ms) { var s = Math.round((ms || 0) / 1000); return s ? (s + 's') : ''; }

  function css(T) {
    if (document.getElementById('bbci-css')) return;
    var s = document.createElement('style'); s.id = 'bbci-css';
    s.textContent = [
      '.bbci{font-family:Inter,system-ui,-apple-system,sans-serif;color:#2a2118;max-width:720px}',
      '.bbci *{box-sizing:border-box}',
      '.bbci .warn{background:#fff7e6;border:1px solid #e7d29a;color:#7a5f22;font-size:12.5px;padding:9px 12px;border-radius:10px;line-height:1.45;margin-bottom:12px}',
      '.bbci .warn b{color:#6a4f16}',
      '.bbci .gated{background:#f4f0e6;border:1px dashed #cbb98f;border-radius:12px;padding:22px;text-align:center;color:#6b5c3e;line-height:1.5}',
      '.bbci .rec{background:#fffdf8;border:1px solid #e6ddca;border-radius:14px;padding:14px;margin-bottom:16px}',
      '.bbci .stage{position:relative;background:#14100c;border-radius:11px;overflow:hidden;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center}',
      '.bbci .stage video{width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}',
      '.bbci .stage.play video{transform:none}',
      '.bbci .stage .ph{color:#b7a98f;font-size:13px;text-align:center;padding:20px}',
      '.bbci .dot{position:absolute;top:10px;left:10px;display:none;align-items:center;gap:6px;background:rgba(20,14,10,.55);color:#fff;border-radius:20px;padding:4px 10px;font-size:12px;font-weight:600}',
      '.bbci .dot.on{display:flex}.bbci .dot i{width:9px;height:9px;border-radius:50%;background:#e5544b;animation:bbciBlink 1s infinite}',
      '@keyframes bbciBlink{0%,100%{opacity:1}50%{opacity:.25}}',
      '.bbci .ctrls{display:flex;gap:8px;align-items:center;margin-top:11px;flex-wrap:wrap}',
      '.bbci button{font:inherit;border:none;border-radius:10px;cursor:pointer;font-weight:600}',
      '.bbci .btn{background:linear-gradient(180deg,__C__,__C2__);color:#fff;padding:10px 15px}',
      '.bbci .btn.ghost{background:#f2ece0;color:__C__}',
      '.bbci .btn:disabled{opacity:.5;cursor:default}',
      '.bbci .cap{flex:1;min-width:160px;border:1px solid #e0d6bf;border-radius:10px;padding:10px 11px;font:inherit;font-size:14px}',
      '.bbci .cap:focus{outline:none;border-color:__C__}',
      '.bbci .hint{font-size:12px;color:#8a7d63;margin-top:7px}',
      '.bbci h4{font-family:Fraunces,Georgia,serif;font-size:15px;margin:16px 0 9px;color:#3a2f22}',
      '.bbci .inbox .row{display:flex;gap:11px;align-items:center;padding:11px 12px;border:1px solid #ece3d0;border-radius:11px;background:#fffdf8;cursor:pointer;margin-bottom:8px}',
      '.bbci .inbox .row:hover{border-color:__C__}',
      '.bbci .av{width:38px;height:38px;flex:none;border-radius:50%;background:#efe7d3;color:__C__;font-family:Fraunces,serif;font-weight:700;display:flex;align-items:center;justify-content:center}',
      '.bbci .nm{font-weight:700;font-size:14px}',
      '.bbci .lst{font-size:12.5px;color:#8a7d63;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:340px}',
      '.bbci .un{margin-left:auto;min-width:9px;height:9px;border-radius:50%;background:__C__}',
      '.bbci .badge{font-size:10.5px;padding:1px 7px;border-radius:20px;background:#eef2ea;color:#4a6b52;font-weight:600}',
      '.bbci .badge.us{background:#fdeceb;color:#95463f}',
      '.bbci .item{display:flex;flex-direction:column;margin-bottom:12px}',
      '.bbci .item.me{align-items:flex-end}',
      '.bbci .card{max-width:82%;border:1px solid #e6ddca;border-radius:14px;overflow:hidden;background:#fffdf8}',
      '.bbci .item.me .card{background:#f3efe6}',
      '.bbci .card video{width:100%;display:block;background:#14100c;max-height:340px}',
      '.bbci .card .thumb{width:100%;aspect-ratio:4/3;background:#14100c;color:#cdbfa4;display:flex;align-items:center;justify-content:center;font-size:13px;cursor:pointer}',
      '.bbci .card .meta{padding:8px 11px;font-size:12px;color:#7c6f57}',
      '.bbci .card .note{padding:2px 11px 10px;font-size:14px;color:#2a2118;line-height:1.4}',
      '.bbci .who{font-size:11px;color:#9a8c70;margin:0 4px 3px;font-weight:600}',
      '.bbci .back{background:none;border:none;color:__C__;cursor:pointer;font-weight:600;padding:0;margin-bottom:10px;font-size:13px}',
      '.bbci .empty{color:#8a7d63;font-size:13.5px;padding:18px 6px;text-align:center;line-height:1.5}'
    ].join('').replace(/__C2__/g, T.c2).replace(/__C__/g, T.c);
    document.head.appendChild(s);
  }

  function b64FromBlob(blob) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { var s = String(r.result || ''); var i = s.indexOf(','); resolve(i >= 0 ? s.slice(i + 1) : s); };
      r.onerror = reject; r.readAsDataURL(blob);
    });
  }

  function pickMime() {
    var opts = ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
    if (window.MediaRecorder && MediaRecorder.isTypeSupported) {
      for (var i = 0; i < opts.length; i++) if (MediaRecorder.isTypeSupported(opts[i])) return opts[i];
    }
    return '';
  }

  function Mount(el, opts) {
    opts = opts || {};
    var me = window.BB_ME || {};
    var role = opts.role || me.role || (/patient/i.test(location.pathname) ? 'patient' : 'provider');
    var lang = opts.lang || me.lang || 'en';
    var T = role === 'patient' ? { c: '#4a6b52', c2: '#3d5a45' } : { c: '#95463f', c2: '#763530' };
    css(T);
    el.classList.add('bbci');

    // region for gating (patient side). Providers always see the console.
    var BR = window.BBRegion;
    function regionOf(key, name) { return BR ? BR.regionOf({ region_key: key, name: name }) : 'intl'; }
    function live(region) { return BR ? BR.telehealthLive(region) : true; }

    var stream = null, recorder = null, chunks = [], capTimer = null, recording = false, lastBlob = null, lastMime = '';

    var WARN = '<div class="warn"><b>Not for emergencies.</b> If this is urgent, call your local emergency number (911 in the U.S.). Check-ins are reviewed between visits, not in real time.</div>';

    function teardown() { try { if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {} stream = null; }

    // ---------- PATIENT view: their own thread + recorder ----------
    function patientView() {
      var pk = opts.patientKey || (BR ? BR.keyOf({ name: me.name, region_key: me.key }) : (me.key || 'me'));
      var region = opts.region || regionOf(me.key, me.name);
      if (!live(region)) {
        el.innerHTML = WARN + '<div class="gated"><b>Secure U.S. check-ins are coming.</b><br>Video check-ins turn on for U.S. patients once the practice enables its HIPAA-secure mode. Until then, please use messages or book a visit.</div>';
        return;
      }
      el.innerHTML = WARN +
        '<div class="rec">' +
        '<div class="stage" id="bbci-stage"><div class="ph" id="bbci-ph">Tap <b>Record</b> to send Dr. Burris a quick video check-in — how you\'re feeling, how the protocol\'s going, anything to show.</div><video id="bbci-prev" muted playsinline></video><div class="dot" id="bbci-dot"><i></i><span id="bbci-cd">0:00</span></div></div>' +
        '<div class="ctrls" id="bbci-ctrls"><button class="btn" id="bbci-rec">● Record</button></div>' +
        '<div class="hint">Up to 30 seconds. You\'ll preview it before sending.</div>' +
        '</div>' +
        '<h4>Your check-ins</h4><div id="bbci-thread"><div class="empty">No check-ins yet.</div></div>';
      wireRecorder(pk, region, 'patient', me.name || 'Patient');
      loadThread(pk, 'patient');
    }

    // ---------- PROVIDER view: inbox -> patient thread ----------
    function providerInbox() {
      el.innerHTML = WARN + '<div id="bbci-inbox"><div class="empty">Loading check-ins…</div></div>';
      api('list', { role: 'provider' }).then(function (r) {
        var box = el.querySelector('#bbci-inbox');
        if (r && r.reason === 'no_kv') { box.innerHTML = '<div class="gated"><b>Check-Ins are finishing setup.</b><br>They switch on as soon as the practice connects its secure server.</div>'; return; }
        var list = (r && r.threads) || [];
        if (!list.length) { box.innerHTML = '<div class="empty">No check-ins yet.<br>When a patient records one, it appears here.</div>'; return; }
        box.className = 'inbox';
        box.innerHTML = list.map(function (t) {
          var rb = t.region === 'us' ? '<span class="badge us">U.S.</span>' : '<span class="badge">Intl</span>';
          return '<div class="row" data-k="' + esc(t.key) + '" data-n="' + esc(t.name || t.key) + '"><div class="av">' + esc((t.name || '?').slice(0, 1).toUpperCase()) + '</div><div style="min-width:0"><div class="nm">' + esc(t.name || t.key) + ' ' + rb + '</div><div class="lst">' + esc(t.lastNote || '') + ' · ' + esc(fmtTime(t.lastTs)) + '</div></div></div>';
        }).join('');
        [].slice.call(box.querySelectorAll('.row')).forEach(function (row) {
          row.addEventListener('click', function () { providerThread(row.getAttribute('data-k'), row.getAttribute('data-n')); });
        });
      });
    }
    function providerThread(pk, name) {
      var region = regionOf(pk, name);
      el.innerHTML = WARN +
        '<button class="back" id="bbci-back">‹ All check-ins</button>' +
        '<h4>' + esc(name || 'Patient') + '</h4>' +
        '<div id="bbci-thread"><div class="empty">Loading…</div></div>' +
        '<div class="rec" style="margin-top:16px">' +
        '<div class="stage" id="bbci-stage"><div class="ph" id="bbci-ph">Record a video reply for ' + esc(name || 'this patient') + ', or type a note below.</div><video id="bbci-prev" muted playsinline></video><div class="dot" id="bbci-dot"><i></i><span id="bbci-cd">0:00</span></div></div>' +
        '<div class="ctrls" id="bbci-ctrls"><button class="btn" id="bbci-rec">● Record reply</button><input class="cap" id="bbci-textonly" placeholder="…or send a written note"><button class="btn ghost" id="bbci-sendtext">Send note</button></div>' +
        '</div>';
      el.querySelector('#bbci-back').addEventListener('click', providerInbox);
      wireRecorder(pk, region, 'provider', 'Barry Burris, NMD', name);
      el.querySelector('#bbci-sendtext').addEventListener('click', function () {
        var inp = el.querySelector('#bbci-textonly'); var txt = (inp.value || '').trim(); if (!txt) return;
        inp.value = '';
        api('put', { role: 'provider', patientKey: pk, patientName: name, kind: 'text', name: 'Barry Burris, NMD', lang: 'en', region: region, note: txt }).then(function () { loadThread(pk, 'provider', name); });
      });
      loadThread(pk, 'provider', name);
      api('seen', { role: 'provider', patientKey: pk, ts: Date.now() });
    }

    // ---------- shared: recorder wiring ----------
    function wireRecorder(pk, region, senderRole, senderName, patientName) {
      var recBtn = el.querySelector('#bbci-rec'); if (!recBtn) return;
      var stage = el.querySelector('#bbci-stage'), prev = el.querySelector('#bbci-prev'),
        ph = el.querySelector('#bbci-ph'), dot = el.querySelector('#bbci-dot'), cd = el.querySelector('#bbci-cd'),
        ctrls = el.querySelector('#bbci-ctrls');
      var startT = 0;

      function setCd() { var s = Math.floor((Date.now() - startT) / 1000); cd.textContent = '0:' + (s < 10 ? '0' + s : s); if (Date.now() - startT >= CAP_MS) stop(); else if (recording) requestAnimationFrame(setCd); }

      recBtn.addEventListener('click', function () { if (recording) stop(); else start(); });

      function start() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { alert('This device can\'t record video here. Try Chrome or Safari.'); return; }
        navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 }, facingMode: 'user' }, audio: true })
          .then(function (s) {
            stream = s; if (ph) ph.style.display = 'none'; stage.classList.remove('play');
            prev.srcObject = s; prev.muted = true; prev.play().catch(function () {});
            lastMime = pickMime(); chunks = [];
            try { recorder = lastMime ? new MediaRecorder(s, { mimeType: lastMime, videoBitsPerSecond: 600000 }) : new MediaRecorder(s); }
            catch (e) { recorder = new MediaRecorder(s); }
            lastMime = recorder.mimeType || lastMime || 'video/webm';
            recorder.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
            recorder.onstop = onStop;
            recorder.start(); recording = true; startT = Date.now();
            recBtn.textContent = '■ Stop'; dot.classList.add('on'); setCd();
          })
          .catch(function () { alert('Couldn\'t access your camera/mic. Please allow permission and try again.'); });
      }
      function stop() { if (recorder && recording) { recording = false; try { recorder.stop(); } catch (e) {} dot.classList.remove('on'); recBtn.textContent = '● Record'; } }

      function onStop() {
        teardown();
        lastBlob = new Blob(chunks, { type: lastMime });
        var url = URL.createObjectURL(lastBlob);
        stage.classList.add('play'); prev.srcObject = null; prev.muted = false; prev.controls = true; prev.src = url; prev.play().catch(function () {});
        var dur = Date.now() - startT;
        ctrls.innerHTML =
          '<button class="btn" id="bbci-send">Send check-in</button>' +
          '<button class="btn ghost" id="bbci-redo">Re-record</button>' +
          '<input class="cap" id="bbci-cap" placeholder="Add a note (optional)">';
        el.querySelector('#bbci-redo').addEventListener('click', function () { try { URL.revokeObjectURL(url); } catch (e) {} resetRecorder(pk, region, senderRole, senderName, patientName); });
        el.querySelector('#bbci-send').addEventListener('click', function () { send(dur, url); });
      }

      function send(dur, url) {
        var btn = el.querySelector('#bbci-send'); if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
        var note = (el.querySelector('#bbci-cap') || {}).value || '';
        b64FromBlob(lastBlob).then(function (b64) {
          if (b64.length > MAX_B64) { if (btn) { btn.disabled = false; btn.textContent = 'Send check-in'; } alert('That clip is a bit long to send. Try a shorter one (under ~25 seconds).'); return; }
          api('put', { role: senderRole, patientKey: pk, patientName: patientName || senderName, name: senderName, lang: lang, region: region, kind: 'video', mime: lastMime, dur: dur, data: b64, note: note })
            .then(function (r) {
              try { URL.revokeObjectURL(url); } catch (e) {}
              if (!r || !r.ok) { if (btn) { btn.disabled = false; btn.textContent = 'Send check-in'; } alert((r && r.message) || 'Could not send — please try again.'); return; }
              resetRecorder(pk, region, senderRole, senderName, patientName);
              loadThread(pk, senderRole === 'patient' ? 'patient' : 'provider', patientName);
            });
        });
      }
    }

    function resetRecorder(pk, region, senderRole, senderName, patientName) {
      // rebuild the recorder card fresh
      if (senderRole === 'patient') patientView(); else providerThread(pk, patientName || senderName);
    }

    // ---------- shared: thread render ----------
    function loadThread(pk, viewer, patientName) {
      api('thread', { patientKey: pk }).then(function (r) {
        var wrap = el.querySelector('#bbci-thread'); if (!wrap) return;
        if (r && r.reason === 'no_kv') { wrap.innerHTML = '<div class="gated">Check-Ins are finishing setup.</div>'; return; }
        var items = (r && r.items) || [];
        if (!items.length) { wrap.innerHTML = '<div class="empty">No check-ins in this thread yet.</div>'; return; }
        wrap.innerHTML = '';
        items.forEach(function (it) {
          var mine = it.from === viewer;
          var wrapEl = document.createElement('div'); wrapEl.className = 'item' + (mine ? ' me' : '');
          var who = mine ? 'You' : esc(it.name || (it.from === 'provider' ? 'Dr. Burris' : 'Patient'));
          var card = '<div class="who">' + who + ' · ' + esc(fmtTime(it.ts)) + '</div><div class="card">';
          if (it.kind === 'video') {
            card += '<div class="thumb" data-id="' + esc(it.id) + '" data-mime="' + esc(it.mime || 'video/webm') + '">▶ Play video check-in' + (it.dur ? ' · ' + fmtDur(it.dur) : '') + '</div>';
            if (it.note) card += '<div class="note">' + esc(it.note) + '</div>';
          } else {
            card += '<div class="note" style="padding:10px 12px">' + esc(it.note) + '</div>';
          }
          card += '</div>';
          wrapEl.innerHTML = card;
          wrap.appendChild(wrapEl);
        });
        [].slice.call(wrap.querySelectorAll('.thumb')).forEach(function (th) {
          th.addEventListener('click', function () { playInto(th); });
        });
        // mark seen
        api('seen', { role: viewer, patientKey: pk, ts: Date.now() });
      });
    }

    function playInto(th) {
      var id = th.getAttribute('data-id'), mime = th.getAttribute('data-mime') || 'video/webm';
      th.textContent = 'Loading…';
      api('video', { id: id }).then(function (r) {
        if (!r || !r.ok || !r.data) { th.textContent = r && r.reason === 'expired' ? 'This check-in has expired.' : 'Could not load video.'; return; }
        try {
          var bytes = atob(r.data); var arr = new Uint8Array(bytes.length);
          for (var i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
          var url = URL.createObjectURL(new Blob([arr], { type: mime }));
          var v = document.createElement('video'); v.src = url; v.controls = true; v.playsInline = true; v.autoplay = true;
          v.onended = function () { }; v.onerror = function () { th.textContent = 'Could not play video.'; };
          th.parentNode.replaceChild(v, th); v.play().catch(function () {});
        } catch (e) { th.textContent = 'Could not play video.'; }
      });
    }

    // go
    if (role === 'provider') providerInbox(); else patientView();
    window.addEventListener('beforeunload', teardown);
  }

  window.BBCheckins = {
    mount: function (el, opts) { if (typeof el === 'string') el = document.querySelector(el); if (el) Mount(el, opts || {}); },
    auto: function () { [].slice.call(document.querySelectorAll('#bb-checkins,[data-bb-checkins]')).forEach(function (el) { if (!el.__bbci) { el.__bbci = 1; Mount(el, { role: el.getAttribute('data-role') || undefined, patientKey: el.getAttribute('data-patient-key') || undefined, patientName: el.getAttribute('data-patient-name') || undefined }); } }); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.BBCheckins.auto); else window.BBCheckins.auto();
})();

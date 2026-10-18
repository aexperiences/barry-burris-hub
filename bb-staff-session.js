/* bb-staff-session.js — Barry Burris, NMD · staff sign-in for the practice pages.
   Load FIRST on every staff page (before anything that calls /api/).
   - Adds the staff session (x-bb-session) to every same-origin /api/ call.
   - If the server says "sign in", or nobody is signed in, shows the sign-in sheet.
   - First run only: the owner account is made with the one-time setup code.
   The lock itself lives on the server (api/_gate.mjs); this file only carries the key. */
(function () {
  var KEY = 'bb_staff_token';
  function getTok() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }
  function setTok(t) { try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch (e) {} }

  function isApi(u) {
    try { var x = new URL(u, location.href); return x.origin === location.origin && x.pathname.indexOf('/api/') === 0 && x.pathname !== '/api/staff-auth'; } catch (e) { return false; }
  }
  var raw = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (!isApi(url)) return raw(input, init);
    var t = getTok();
    init = Object.assign({}, init || {});
    var h = new Headers(init.headers || (typeof input !== 'string' && input.headers) || {});
    if (t) h.set('x-bb-session', t);
    init.headers = h;
    return raw(input, init).then(function (r) {
      if (r.status === 401) { setTok(''); show(); }
      return r;
    });
  };

  function auth(body) {
    var h = { 'content-type': 'application/json' }; var t = getTok(); if (t) h['x-bb-session'] = t;
    return raw('/api/staff-auth', { method: 'POST', headers: h, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .catch(function () { return { ok: false, message: 'No connection. Try again.' }; });
  }

  var CSS = '#bbss{position:fixed;inset:0;z-index:2147483000;background:rgba(244,238,222,.97);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Manrope,system-ui,-apple-system,sans-serif;color:#2a1810}' +
    '#bbss .card{width:100%;max-width:400px;background:#fffdf7;border:1px solid #e6dcc4;border-radius:18px;padding:26px 22px;box-shadow:0 12px 40px rgba(42,24,16,.12)}' +
    '#bbss h2{margin:0 0 6px;font:400 28px/1.15 "Instrument Serif",Georgia,serif}' +
    '#bbss p{margin:0 0 16px;font-size:15px;line-height:1.45;color:#5a463a}' +
    '#bbss label{display:block;font-size:13px;font-weight:600;margin:12px 0 5px}' +
    '#bbss input{width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:12px 13px;border:1px solid #d9ccb0;border-radius:11px;background:#fff;color:#2a1810}' +
    '#bbss button{width:100%;margin-top:18px;font:inherit;font-size:16px;font-weight:700;padding:13px;border:0;border-radius:12px;background:#a8322a;color:#fff;cursor:pointer}' +
    '#bbss button[disabled]{opacity:.6}#bbss .err{color:#a8322a;font-size:14px;min-height:20px;margin-top:10px}' +
    '#bbss .lock{font-size:12px;color:#7a6658;margin-top:14px;text-align:center}';

  var shown = false;
  function show() {
    if (shown) return; shown = true;
    var go = function () {
      var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
      var w = document.createElement('div'); w.id = 'bbss'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true');
      w.innerHTML = '<div class="card"><h2>Practice sign-in</h2><p>Loading…</p></div>';
      document.body.appendChild(w);
      auth({ do: 'status' }).then(function (s) { render(w, s || {}); });
    };
    document.body ? go() : document.addEventListener('DOMContentLoaded', go);
  }

  function render(w, s) {
    var card = w.querySelector('.card');
    if (s.signedIn) { location.reload(); return; }
    if (!s.setup && !s.setupOpen) {
      card.innerHTML = '<h2>Practice sign-in</h2><p>Sign-in for this practice is being set up. The patient records stay locked until it is.</p><div class="lock">Barry Burris, NMD · staff only</div>';
      return;
    }
    var setup = !s.setup;
    card.innerHTML = '<h2>' + (setup ? 'Create the owner account' : 'Practice sign-in') + '</h2>' +
      '<p>' + (setup ? 'First time only. Enter the setup code you were given, then your email and a password.' : 'Staff only. Patient records are private.') + '</p>' +
      '<form autocomplete="on">' +
      (setup ? '<label for="bbss-c">Setup code</label><input id="bbss-c" autocomplete="one-time-code" required>' +
               '<label for="bbss-n">Your name</label><input id="bbss-n" autocomplete="name" value="Barry Burris, NMD">' : '') +
      '<label for="bbss-e">Email</label><input id="bbss-e" type="email" autocomplete="username" required>' +
      '<label for="bbss-p">Password' + (setup ? ' (ten characters or more)' : '') + '</label><input id="bbss-p" type="password" autocomplete="' + (setup ? 'new-password' : 'current-password') + '" required>' +
      '<button type="submit">' + (setup ? 'Create and sign in' : 'Sign in') + '</button><div class="err" aria-live="polite"></div></form>' +
      '<div class="lock">Barry Burris, NMD · staff only</div>';
    var f = card.querySelector('form'), err = card.querySelector('.err'), btn = card.querySelector('button');
    setTimeout(function () { var i = card.querySelector('input'); if (i) i.focus(); }, 30);
    f.addEventListener('submit', function (ev) {
      ev.preventDefault(); err.textContent = ''; btn.disabled = true;
      var v = function (id) { var e = card.querySelector('#' + id); return e ? e.value : ''; };
      var body = setup ? { do: 'setup', code: v('bbss-c'), name: v('bbss-n'), email: v('bbss-e'), password: v('bbss-p') }
                       : { do: 'login', email: v('bbss-e'), password: v('bbss-p') };
      auth(body).then(function (r) {
        btn.disabled = false;
        if (r && r.ok && r.token) { setTok(r.token); location.reload(); return; }
        err.textContent = (r && r.message) || 'That did not work. Try again.';
      });
    });
  }

  window.BBStaff = {
    token: getTok,
    signOut: function () { auth({ do: 'logout' }).then(function () { setTok(''); location.reload(); }); },
    me: function () { return auth({ do: 'me' }); }
  };

  // On load: no key, or an expired key -> the sheet.
  if (!getTok()) show();
  else auth({ do: 'me' }).then(function (s) { if (s && s.ok && !s.signedIn) { setTok(''); show(); } });
})();

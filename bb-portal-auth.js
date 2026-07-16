/* bb-portal-auth.js — Barry Burris, NMD · PATIENT account layer (client-side)
   ------------------------------------------------------------------------
   The patient-facing sibling of bb-auth.js (which is the STAFF door).
   This is a production-shaped auth model with ONE flip to go real:

     BBPortal.PORTAL_LIVE = false  → DEMO: accounts + sessions live in this
                                     browser only (localStorage). No PHI leaves
                                     the device. Great for showing the real flow.
     BBPortal.PORTAL_LIVE = true   → LIVE: every call hits the documented
                                     /api/portal/* endpoints on the HIPAA backend.
                                     Passwords are verified server-side (argon2),
                                     sessions are httpOnly cookies, PHI is encrypted
                                     at rest. Nothing about the UI changes.

   Security posture (held on purpose):
   • Demo password hashing is SHA-256 + per-account random salt. This is DEMO
     grade only — real credential hashing happens server-side (argon2id) once
     PORTAL_LIVE. We never store plaintext passwords, even in the demo.
   • Idle timeout: sessions auto-expire after IDLE_MS of inactivity (medical
     standard). touch() extends on real activity; the UI signs the patient out
     with a clear notice when it lapses.
   • No PHI in URLs. The demo "?p=" quick-enter is a sample INDEX, not identity.
   • getMode() lets the UI show an honest banner about which lane it's in.

   Built by Accelerated Experiences, LLC.
*/
(function () {
  'use strict';

  var CFG = {
    PORTAL_LIVE: false,                 // <— the one flip to the real backend
    API: '/api/portal',                 // register|login|session|reset|logout
    IDLE_MS: 15 * 60 * 1000,            // 15-minute inactivity timeout
    MIN_PASS: 8
  };

  var K_ACCTS = 'bb_portal_accounts';   // demo account store
  var K_SESS  = 'bb_portal_sess';       // active session

  /* ---------- storage helpers ---------- */
  function read(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }

  /* ---------- tiny utils ---------- */
  function now() { return Date.now(); }
  function uid(p) { return (p || 'a') + now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }
  function normEmail(e) { return String(e || '').trim().toLowerCase(); }
  function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail(e)); }
  function passIssues(p) {
    p = String(p || '');
    var out = [];
    if (p.length < CFG.MIN_PASS) out.push('at least ' + CFG.MIN_PASS + ' characters');
    if (!/[A-Za-z]/.test(p)) out.push('a letter');
    if (!/[0-9]/.test(p)) out.push('a number');
    return out;
  }

  /* ---------- hashing (demo grade; server does argon2 when LIVE) ---------- */
  function randSalt() {
    try {
      var a = new Uint8Array(16);
      (self.crypto || window.crypto).getRandomValues(a);
      return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    } catch (e) {
      return uid('s') + uid('s');
    }
  }
  function djb2(str) { // deterministic fallback if SubtleCrypto is unavailable
    var h = 5381; for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return ('00000000' + h.toString(16)).slice(-8);
  }
  function sha256hex(msg) {
    var subtle = (self.crypto && self.crypto.subtle) || (window.crypto && window.crypto.subtle);
    if (!subtle) return Promise.resolve('djb2$' + djb2(msg)); // testable fallback
    var buf = new TextEncoder().encode(msg);
    return subtle.digest('SHA-256', buf).then(function (d) {
      return Array.prototype.map.call(new Uint8Array(d), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }
  function hashPass(pass, salt) { return sha256hex(salt + '::' + pass); }

  /* ---------- account store (demo) ---------- */
  function accounts() { return read(K_ACCTS, []); }
  function saveAccounts(a) { return write(K_ACCTS, a); }
  function findByEmail(e) { e = normEmail(e); return accounts().filter(function (x) { return x.email === e; })[0] || null; }

  /* ---------- session ---------- */
  function mkSession(acc, demo, patientIdx) {
    return {
      accountId: acc ? acc.id : null,
      email: acc ? acc.email : null,
      name: acc ? acc.name : null,
      patientIdx: (patientIdx != null ? patientIdx : (acc ? acc.patientIdx : null)),
      demo: !!demo,
      ts: now(),
      exp: now() + CFG.IDLE_MS
    };
  }
  function session() {
    var s = read(K_SESS, null);
    if (!s) return null;
    if (s.exp && now() > s.exp) { del(K_SESS); return null; }   // idle-expired
    return s;
  }
  function touch() {
    var s = read(K_SESS, null);
    if (!s) return null;
    s.exp = now() + CFG.IDLE_MS;
    write(K_SESS, s);
    return s;
  }
  function msLeft() {
    var s = read(K_SESS, null);
    if (!s || !s.exp) return 0;
    return Math.max(0, s.exp - now());
  }
  function signOut() {
    del(K_SESS);
    if (CFG.PORTAL_LIVE) { try { fetch(CFG.API + '/logout', { method: 'POST', credentials: 'include' }); } catch (e) {} }
    return true;
  }

  /* ---------- register / login / reset ---------- */
  // returns a Promise<{ok:true, session} | {ok:false, error, field}>
  function register(opts) {
    opts = opts || {};
    var email = normEmail(opts.email), pass = opts.password, name = String(opts.name || '').trim();
    if (!name) return Promise.resolve({ ok: false, field: 'name', code: 'name', error: 'Please enter your name.' });
    if (!validEmail(email)) return Promise.resolve({ ok: false, field: 'email', code: 'email_invalid', error: 'Please enter a valid email.' });
    var pi = passIssues(pass);
    if (pi.length) return Promise.resolve({ ok: false, field: 'password', code: 'pass_rules', error: 'Password needs ' + pi.join(', ') + '.' });

    if (CFG.PORTAL_LIVE) {
      return fetch(CFG.API + '/register', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: pass, name: name })
      }).then(function (r) { return r.json(); });
    }
    // demo
    // anti-enumeration: don't confirm an email is registered
    if (findByEmail(email)) return Promise.resolve({ ok: false, field: 'form', code: 'exists', error: 'We couldn’t create that account. If you already have one, try signing in.' });
    var salt = randSalt();
    return hashPass(pass, salt).then(function (h) {
      var acc = { id: uid('acct_'), email: email, name: name, salt: salt, hash: h,
        patientIdx: (opts.patientIdx != null ? opts.patientIdx : null), createdAt: now() };
      var all = accounts(); all.push(acc); saveAccounts(all);
      var s = mkSession(acc, true, acc.patientIdx); write(K_SESS, s);
      return { ok: true, session: s, account: { id: acc.id, email: acc.email, name: acc.name } };
    });
  }

  function login(opts) {
    opts = opts || {};
    var email = normEmail(opts.email), pass = opts.password;
    if (!validEmail(email)) return Promise.resolve({ ok: false, field: 'email', code: 'email_invalid', error: 'Please enter a valid email.' });
    if (!pass) return Promise.resolve({ ok: false, field: 'form', code: 'login', error: 'Email or password is incorrect.' });

    if (CFG.PORTAL_LIVE) {
      return fetch(CFG.API + '/login', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: pass })
      }).then(function (r) { return r.json(); });
    }
    var acc = findByEmail(email);
    // anti-enumeration: identical response whether the email is unknown or the password is wrong
    if (!acc) return Promise.resolve({ ok: false, field: 'form', code: 'login', error: 'Email or password is incorrect.' });
    return hashPass(pass, acc.salt).then(function (h) {
      if (h !== acc.hash) return { ok: false, field: 'form', code: 'login', error: 'Email or password is incorrect.' };
      var s = mkSession(acc, true, acc.patientIdx); write(K_SESS, s);
      return { ok: true, session: s, account: { id: acc.id, email: acc.email, name: acc.name } };
    });
  }

  function requestReset(email) {
    email = normEmail(email);
    if (CFG.PORTAL_LIVE) {
      return fetch(CFG.API + '/reset', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email })
      }).then(function (r) { return r.json(); }).catch(function () { return { ok: true }; });
    }
    // demo: never reveal whether an account exists (anti-enumeration)
    return Promise.resolve({ ok: true, demo: true });
  }

  // link the signed-in account to a sample patient record (demo convenience)
  function linkPatient(patientIdx) {
    var s = read(K_SESS, null); if (!s) return false;
    s.patientIdx = patientIdx; write(K_SESS, s);
    if (s.accountId) {
      var all = accounts().map(function (a) { return a.id === s.accountId ? Object.assign(a, { patientIdx: patientIdx }) : a; });
      saveAccounts(all);
    }
    return true;
  }

  // DEMO ONLY: enter as a sample patient without creating an account (the picker path)
  function demoEnter(patientIdx, displayName) {
    var s = mkSession(null, true, patientIdx);
    s.name = displayName || null;
    write(K_SESS, s);
    return s;
  }

  function getMode() { return CFG.PORTAL_LIVE ? 'live' : 'demo'; }

  window.BBPortal = {
    CFG: CFG,
    PORTAL_LIVE: CFG.PORTAL_LIVE, IDLE_MS: CFG.IDLE_MS,
    register: register, login: login, requestReset: requestReset,
    session: session, touch: touch, msLeft: msLeft, signOut: signOut,
    linkPatient: linkPatient, demoEnter: demoEnter, getMode: getMode,
    validEmail: validEmail, passIssues: passIssues,
    _accounts: accounts // introspection for tests
  };
})();

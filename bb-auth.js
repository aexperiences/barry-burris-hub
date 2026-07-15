/* bb-auth.js — Barry Burris, NMD · one-door auth + roles (client-side, no backend)
   Modeled on the LCP hub's one-door pattern, adapted for a medical practice.
   DEV_OPEN = true  → the door exists but nobody has to log in yet (pages open as Owner).
   Flip DEV_OPEN = false to ENFORCE the gate (pages redirect to the sign-in door). */
(function () {
  var DEV_OPEN = true;                 // <— set false to require real sign-in
  var SKEY = 'bb_sess', TKEY = 'bb_team', PKEY = 'bb_owner_pass';

  // roles → capabilities. '*' = everything.
  var ROLES = {
    owner:     { label: 'Owner / Provider',        icon: '👑', desc: 'Full access — the whole practice',            caps: ['*'] },
    provider:  { label: 'Provider / Clinician',    icon: '🩺', desc: 'Schedule, charts & clinical notes',           caps: ['schedule.view','schedule.edit','contacts.view','labs.view','labs.edit','charting.view','charting.finalize'] },
    frontdesk: { label: 'Front Desk / Phlebotomist',icon:'🗓️', desc: 'Scheduling, contacts, billing & labs',        caps: ['schedule.view','schedule.edit','contacts.view','contacts.edit','billing.view','billing.edit','labs.view','labs.edit'] },
    assistant: { label: 'Assistant',               icon: '🤝', desc: 'View the schedule & contacts',                caps: ['schedule.view','contacts.view'] }
  };

  function read(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function getSession() { return read(SKEY, null); }
  function setSession(s) { s = s || {}; s.ts = Date.now(); write(SKEY, s); return s; }
  function signOut() { try { localStorage.removeItem(SKEY); } catch (e) {} }

  // ensure a session exists; in DEV_OPEN, mint an Owner so pages just open.
  function ensure() {
    var s = getSession();
    if (s) return s;
    if (DEV_OPEN) return setSession({ name: 'Barry Burris, NMD', role: 'owner', dev: true });
    return null;
  }
  // call at the top of a gated page.
  function requireGate() {
    var s = getSession();
    if (s) return s;
    if (DEV_OPEN) return ensure();
    location.href = 'barry-signin.html';
    return null;
  }

  function caps(role) { var r = ROLES[role]; return r ? r.caps : []; }
  function can(cap) {
    var s = getSession() || ensure();
    if (!s) return false;
    var c = caps(s.role);
    return c.indexOf('*') >= 0 || c.indexOf(cap) >= 0;
  }
  function roleLabel(role) { return (ROLES[role] && ROLES[role].label) || role || ''; }

  // owner passcode (optional). Unset = open (any/no passcode is accepted) — like LCP's unset DASH_PASS.
  function ownerPass() { try { return localStorage.getItem(PKEY) || ''; } catch (e) { return ''; } }
  function setOwnerPass(p) { try { p ? localStorage.setItem(PKEY, p) : localStorage.removeItem(PKEY); } catch (e) {} }
  function checkOwner(p) { var real = ownerPass(); return DEV_OPEN || !real || p === real; }

  // team roster (employees the owner adds)
  function getTeam() { return read(TKEY, []); }
  function saveTeam(t) { write(TKEY, t); return t; }
  function addMember(m) { var t = getTeam(); m.id = 'm' + Date.now().toString(36) + Math.floor(Math.random() * 900 + 100); t.push(m); return saveTeam(t); }
  function updateMember(id, patch) { var t = getTeam().map(function (x) { return x.id === id ? Object.assign(x, patch) : x; }); return saveTeam(t); }
  function removeMember(id) { return saveTeam(getTeam().filter(function (x) { return x.id !== id; })); }

  // small "signed in as … · Sign out" chip you can drop into any header
  function chipHTML() {
    var s = getSession() || {};
    var who = s.name || 'Owner';
    return '<span class="bb-chip" title="' + roleLabel(s.role) + '">' +
      '<b>' + who + '</b> · ' + roleLabel(s.role) +
      (DEV_OPEN ? ' · <em style="opacity:.7">open</em>' : '') +
      ' <a href="#" onclick="BBAuth.signOut();location.href=\'barry-signin.html\';return false;">Sign out</a></span>';
  }

  window.BBAuth = {
    DEV_OPEN: DEV_OPEN, ROLES: ROLES,
    getSession: getSession, setSession: setSession, signOut: signOut, ensure: ensure, requireGate: requireGate,
    caps: caps, can: can, roleLabel: roleLabel,
    ownerPass: ownerPass, setOwnerPass: setOwnerPass, checkOwner: checkOwner,
    getTeam: getTeam, saveTeam: saveTeam, addMember: addMember, updateMember: updateMember, removeMember: removeMember,
    chipHTML: chipHTML
  };
})();

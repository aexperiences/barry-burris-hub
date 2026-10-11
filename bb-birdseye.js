/* bb-birdseye.js — BIRDSEYE for Barry Burris, NMD (BB Practice OS). Accelerated Experiences LLC · Oct 11 2026.

   The adopter for Barry's hub — the hub's own family (a hand-built multi-page hub plus one single-page app,
   barry-burris-hub.html, whose rooms live at #billing, #labs …). It lays the Birdseye home, dock, More sheet
   and helper over every STAFF page and leaves everything underneath working exactly as before:
     - the legacy sidebar (#bb-side / .side), the hub top bar and the phone tab bar are HIDDEN, never removed;
     - no page logic, no /api, no stored record is touched — every read below is a read-only list call;
     - patient pages (anything with "patient" in the path) never load the staff Birdseye.
   Loaded by bb-app.js (BIRDSEYE block) and by a <script> tag on the hub, telehealth, directory, docs and privacy pages.
   window.BBEye is the engine the config reads: db() = the practice's synced stores + this device's stores. */
(function () {
  if (window.__bbEye) return; window.__bbEye = true;
  if (/patient/i.test(location.pathname)) return;               /* the patient side keeps its own portal */

  var me = document.currentScript, base = me && me.src ? me.src.replace(/[^\/]*(\?.*)?$/, "") : "";
  var HOME = "barry-burris-hub.html";
  document.documentElement.classList.add("bs-on");
  function css(h) { var l = document.createElement("link"); l.rel = "stylesheet"; l.href = base + h; document.head.appendChild(l); }
  css("birdseye/birdseye.css"); css("bb-birdseye.css");
  function load(src, cb) { var s = document.createElement("script"); s.src = base + src; s.onload = cb; s.onerror = cb; document.head.appendChild(s); }

  /* ---------------- the engine: real stores only ---------------- */
  var cache = { events: null, threads: null, contactsN: null, docsN: null, orders: null, books: null }, done = false;
  /* a per-tab snapshot (sessionStorage — gone when the tab closes) so the next room paints real figures at once;
     the contact list is kept as a count only */
  var SNAP = "bb_eye_snap";
  try { var sn = JSON.parse(sessionStorage.getItem(SNAP) || "null"); if (sn && sn.day === new Date().toDateString()) Object.keys(cache).forEach(function (k) { if (sn[k] != null) cache[k] = sn[k]; }); } catch (e) {}
  function snap() { try { var o = { day: new Date().toDateString() }; Object.keys(cache).forEach(function (k) { o[k] = cache[k]; }); sessionStorage.setItem(SNAP, JSON.stringify(o)); } catch (e) {} }
  function lsj(k) { try { var v = JSON.parse(localStorage.getItem(k)); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function lss(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  window.BBEye = {
    db: function () {
      return { events: cache.events, threads: cache.threads, contactsN: cache.contactsN, docsN: cache.docsN, orders: cache.orders, books: cache.books,
        invoices: lsj("bb_invoices"), labs: lsj("bb_labs"), leads: lsj("bb_leads"), records: lsj("bb_records"),
        intakes: lsj("bb_uploaded_intakes"), team: lsj("bb_team"), briefSeen: lss("bb_briefs_seen") };
    },
    loaded: function () { return done; }
  };
  var pend = null;
  function landed() { snap(); clearTimeout(pend); pend = setTimeout(safeRefresh, 120); }
  function get(path, key, pick) {
    return fetch(path, { cache: "no-store", credentials: "same-origin" }).then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.ok !== false) { var v = pick(j); if (v != null) { cache[key] = v; landed(); } } }).catch(function () {});
  }
  function fetchAll() {
    return Promise.all([
      get("/api/calendar?do=list", "events", function (j) { return Array.isArray(j.events) ? j.events : null; }),
      get("/api/checkins?do=inbox", "threads", function (j) { return Array.isArray(j.threads) ? j.threads : null; }),
      get("/api/dispensary?do=orders", "orders", function (j) { return Array.isArray(j.orders) ? j.orders.map(function (o) { return { status: o.status, paid: o.paid }; }) : null; }),
      get("/api/docs?do=list", "docsN", function (j) { return Array.isArray(j.docs) ? j.docs.length : null; }),
      get("/api/books", "books", function (j) { return j.configured === false || !j.pnl ? null : { pnl: { netIncome: j.pnl.netIncome, totalIncome: j.pnl.totalIncome } }; }),
      get("/api/contacts?do=list", "contactsN", function (j) { return Array.isArray(j.contacts) ? j.contacts.length : null; })
    ]).then(function () { done = true; landed(); });
  }

  /* ---------------- where are we ---------------- */
  var VIEW_ROOM = { intakes: "intakes", charting: "charting", billing: "billing", services: "services", labs: "labs", labresults: "labs", labtrends: "labs",
    protocols: "protocols", growth: "growth", team: "team", profile: "profile", schedule: "calendar", patients: "contacts" };
  function file() { return location.pathname.split("/").pop() || "index.html"; }
  function isHub() { return file() === HOME; }
  function hubState() {
    var h = (location.hash || "").replace("#", "").trim();
    if (h === "glance") return { mode: "glance" };
    if (VIEW_ROOM[h]) return { mode: "room", active: VIEW_ROOM[h], view: h };
    return { mode: "home" };
  }

  var BS, C, mountEl, footerHost, first = true, legacyGo = null;
  function mount(s) {
    BS.mount({ config: C, mode: s.mode, active: s.active || null, mountEl: mountEl, footerHost: footerHost, footer: first });
    if (first) { first = false; extras(); }
  }

  /* the page's own content goes into one wrapper so a room the seat cannot open can be shut (the Birdseye chrome stays outside) */
  var CHROME = /^(bb-side|bb-burger|bb-scrim|bbai.*|bbmsg.*|bsTop)$/;
  function wrap() {
    var w = document.getElementById("bbBsContent"); if (w) return w;
    w = document.createElement("div"); w.id = "bbBsContent";
    [].slice.call(document.body.childNodes).forEach(function (n) {
      if (n.nodeType === 1 && (/^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(n.tagName) || CHROME.test(n.id || "") || /\b(bb-tabbar|bb-scrim|bb-install|bs-tail|bs-top|bs-foot)\b/.test(String(n.className || "")))) return;
      w.appendChild(n);
    });
    document.body.insertBefore(w, document.body.firstChild);
    return w;
  }

  function extras() {
    /* who is signed in + sign out, kept reachable in the footer (the hub top bar that held it is hidden) */
    try {
      var f = document.querySelector(".bs-foot");
      if (f && window.BBAuth && !f.querySelector(".bb-bs-who")) { var d = document.createElement("div"); d.className = "bb-bs-who"; d.innerHTML = window.BBAuth.chipHTML(); f.appendChild(d); }
    } catch (e) {}
    try { BS.americanize(mountEl); } catch (e) {}
    /* "Talk to Brian": Barry's own AI helper (bb-assistant.js), opened from the Birdseye helper drawer */
    document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("#bsTab,#bsAsk")) setTimeout(brian, 0); }, true);
    /* patient messages (bb-messages.js, hub page): its floating bubble moves into the header, unread badge and all */
    var tries = 0; (function m() { if (!msgBtn() && ++tries < 20) setTimeout(m, 500); })();
    if (!document.querySelector('script[src="bb-assistant.js"]') && !window.__bbAI) { var s = document.createElement("script"); s.src = base + "bb-assistant.js"; document.body.appendChild(s); }
  }
  var CHAT = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/></svg>';
  function msgBtn() {
    if (document.getElementById("bbBsMsg")) return true;
    var fab = document.getElementById("bbmsg-btn"), twin = document.getElementById("bsTwin"); if (!fab || !twin) return false;
    var b = document.createElement("button"); b.type = "button"; b.id = "bbBsMsg"; b.className = "bs-iconbtn bb-bs-msg"; b.title = "Patient messages";
    b.setAttribute("aria-label", "Patient messages"); b.innerHTML = CHAT + '<span class="bb-bs-bdg"></span>';
    b.onclick = function () { fab.click(); };
    twin.parentNode.insertBefore(b, twin);
    var src = document.getElementById("bbmsg-bdg"), dst = b.querySelector(".bb-bs-bdg");
    function sync() { var on = src.classList.contains("on"); unread = on ? src.textContent : ""; dst.textContent = unread; dst.classList.toggle("on", on); b.setAttribute("aria-label", on ? "Patient messages — " + unread + " unread" : "Patient messages");
      document.documentElement.classList.toggle("bb-msg-unread", on); var m = document.querySelector(".bb-msgs"); if (m) m.textContent = msgLabel(); }
    if (src && window.MutationObserver) { new MutationObserver(sync).observe(src, { attributes: true, childList: true, characterData: true, subtree: true }); sync(); }
    document.documentElement.classList.add("bb-msg-in-head");
    return true;
  }
  var unread = "";
  function msgLabel() { return "Patient messages" + (unread ? " — " + unread + " unread" : ""); }
  /* the helper drawer carries two doors: Brian (bb-assistant.js) and, on the hub, the patient-messages inbox (bb-messages.js) */
  function brian() {
    var d = document.getElementById("bsDrawer"); if (!d) return;
    var h = d.querySelector(".bs-dh"), at = h ? h.nextSibling : null;
    function add(cls, text, fab) {
      if (!fab || d.querySelector("." + cls.split(" ").pop())) return;
      var b = document.createElement("button"); b.type = "button"; b.className = "bs-btn bb-dbtn " + cls; b.textContent = text;
      b.onclick = function () { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); setTimeout(function () { fab.click(); }, 120); };
      if (at) d.insertBefore(b, at); else d.appendChild(b);
    }
    add("bs-a bb-brian", "Talk to Brian — the AI, by voice or typing", document.getElementById("bbai-btn"));
    add("bb-msgs", msgLabel(), document.getElementById("bbmsg-btn"));
  }

  function init() {
    BS = window.BirdseyeShell; C = window.BIRDSEYE;
    if (!BS || !C) { document.documentElement.classList.remove("bs-on"); return; }   /* the shell did not arrive: the page stays exactly as it was */
    var legacy = ["#bb-side", "#bb-burger", "#bb-scrim", ".bb-tabbar", ".bb-scrim", ".app > .side", ".app > .main > .top"];
    BS.replaceLegacy(legacy);
    if (isHub()) {
      mountEl = document.querySelector(".app > .main"); footerHost = document.querySelector(".app");
      if (typeof window.go === "function") {
        legacyGo = window.go;
        /* the hub's own buttons call go('billing') etc. — keep the Birdseye room (and the address) in step with them */
        window.go = function (k) {
          var r = legacyGo.apply(this, arguments);
          try {
            var cur = (location.hash || "").replace("#", "");
            if (k === "home") { if (cur) history.replaceState(null, "", location.pathname + location.search); mount({ mode: "home" }); }
            else if (VIEW_ROOM[k]) { if (cur !== k) history.replaceState(null, "", location.pathname + location.search + "#" + k); mount({ mode: "room", active: VIEW_ROOM[k] }); }
          } catch (e) {}
          return r;
        };
      }
      var s0 = hubState();
      mount(s0);
      if (s0.mode === "room" && !BS.canOpen(s0.active) && legacyGo) legacyGo("home");   /* a room this seat cannot open stays shut and is not drawn */
      window.addEventListener("hashchange", function () {
        var s = hubState();
        if (legacyGo) { if (s.mode === "room" && BS.canOpen(s.active)) legacyGo(s.view); else if (s.mode === "home") legacyGo("home"); }
        mount(s);
      });
    } else {
      mountEl = wrap(); footerHost = document.body;
      var f = file(), r = (C.rooms || []).filter(function (x) { return x.href && x.href.split("#")[0].split("?")[0] === f; })[0];
      mount({ mode: "room", active: r ? r.k : null });
    }
    fetchAll();
  }
  /* the live figures arrive once; repaint only when no sheet, drawer, dialog or open dashboard would be disturbed */
  function safeRefresh() {
    if (!BS) return;
    if (document.querySelector("#bsSheet.up, #bsDrawer.on, .bs-modal.on, .bs-lopen, #bbai.on, #bbmsg.on")) { clearTimeout(pend); pend = setTimeout(safeRefresh, 700); return; }
    try { BS.refresh(); } catch (e) {}
  }

  function ready(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn(); }
  load("birdseye/birdseye-shell.js", function () { load("birdseye.config.js", function () { ready(function () { setTimeout(init, 0); }); }); });
})();

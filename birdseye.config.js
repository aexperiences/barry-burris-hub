/* BIRDSEYE CONFIG — BB Practice OS · Barry Burris, NMD (naturopathic medicine & longevity).
   Hand-tailored by the Birdseye Machine (machines/birdseye) for Barry's own hub — his hub is its own family
   (a hand-built multi-page hub + one SPA page), so this file is written by hand, not by convert.py apply.
   The adopter that mounts it on every staff page is bb-birdseye.js; patient pages never load it.

   EVERY FIGURE IS REAL. Each one names its source:
     api:*     — the practice's shared, synced store (/api/<x>, read-only list calls, any device)
     device:*  — the store the hub itself keeps on this device (localStorage, same keys the rooms use)
   A figure whose source has not loaded (or is unreachable) shows the room's one-line description.
   The SAMPLE intake roster (bb-intakes.js) is never counted. No patient is ever invented. */
(function () {
  function T(f) { try { return f(); } catch (e) { return undefined; } }
  function tele(e) { return /tele|video|virtual|zoom|meet/i.test(String(e.mode || "") + " " + String(e.type || "")); }
  function today(H) { return H.iso(new Date()); }
  function dayEvents(D, H) { if (!D.events) return null; var t = today(H); return D.events.filter(function (e) { return String(e.start || "").slice(0, 10) === t; }).sort(function (a, b) { return String(a.start) < String(b.start) ? -1 : 1; }); }
  function waiting(D) { return D.threads ? D.threads.filter(function (t) { return t.lastFrom === "patient"; }) : null; }
  function toFill(D) { return D.orders ? D.orders.filter(function (o) { return ["new", "paid", "fulfilling"].indexOf(o.status) >= 0; }) : null; }
  function labsOpen(D) { return D.labs.filter(function (l) { return l.st !== "Resulted"; }); }
  function openInv(D) { return D.invoices.filter(function (i) { return i.st !== "ok"; }); }
  function newLeads(D) { return D.leads.filter(function (l) { return l.st === "new"; }); }
  function tm(e) { var s = String(e.start || ""); return s.length > 10 ? s.slice(11, 16) : "All day"; }

  window.BIRDSEYE = {
    id: "bb-practice", engine: "BBEye", routing: "multipage", home: "barry-burris-hub.html",
    trade: "Naturopathic medicine & longevity — solo NMD practice with a supplement dispensary, labs, telehealth (incl. Vietnam)",
    brand: { name: "BB Practice OS", short: "BB Practice", icon: "icon-512.png", aos: "birdseye/marks/aos-business.png", aeMark: "birdseye/marks/ae-mark.png", version: "V. Birdseye 1.0", line: "Naturopathic medicine & longevity" },
    houseNoun: "practice",
    houseName: function () { return "Barry Burris, NMD"; },
    today: function () { return new Date(); },
    defaultSkin: "studio",
    legacyBelow: "The full practice dashboard",
    latestBrief: "2026-07-22",   /* keep in lockstep with LATEST_BRIEF in bb-nav.js / barry-burris-hub.html */

    wings: [{ k: "day", name: "The Day" }, { k: "patients", name: "Patients" }, { k: "business", name: "Business" }, { k: "grow", name: "Grow" }, { k: "practice", name: "The Practice" }],
    rooms: [
      { k: "calendar",   label: "Calendar",           wing: "day",      href: "barry-calendar.html",                 icon: "birdseye/icons/calendar.svg",              blurb: "Visits and appointments" },
      { k: "telehealth", label: "Video Visits",       wing: "day",      href: "telehealth.html",                     icon: "birdseye/icons/meet.svg",                  blurb: "Live video, with an interpreter", short: "Video" },
      { k: "checkins",   label: "Check-Ins",          wing: "day",      href: "barry-checkins.html",                 icon: "birdseye/icons/family-portal.svg",         blurb: "Patient video and text check-ins" },
      { k: "intakes",    label: "Intakes",            wing: "day",      href: "barry-burris-hub.html#intakes",       icon: "birdseye/icons/intake-and-assessment.svg", blurb: "New-patient questionnaires" },
      { k: "charting",   label: "Charting",           wing: "day",      href: "soap-note-generator-prototype.html",  icon: "birdseye/icons/care-plans.svg",            blurb: "AI-drafted SOAP notes to sign" },
      { k: "contacts",   label: "Contacts",           wing: "patients", href: "barry-contacts.html",                 icon: "birdseye/icons/contacts.svg",              blurb: "Patients and referral partners" },
      { k: "records",    label: "Records",            wing: "patients", href: "barry-records.html",                  icon: "birdseye/icons/records.svg",               blurb: "The filing cabinet" },
      { k: "labs",       label: "Labs",               wing: "patients", href: "barry-burris-hub.html#labs",          icon: "birdseye/icons/labs.svg",                  blurb: "Lab orders, results and trends" },
      { k: "docs",       label: "Documents",          wing: "patients", href: "barry-docs.html",                     icon: "birdseye/icons/documents.svg",             blurb: "Letters and documents", short: "Docs" },
      { k: "portal",     label: "Patient Portal",     wing: "patients", href: "patient-portal.html",                 icon: "birdseye/icons/customer-portal.svg",       blurb: "What the patient sees", short: "Portal" },
      { k: "billing",    label: "Billing",            wing: "business", href: "barry-burris-hub.html#billing",       icon: "birdseye/icons/invoices.svg",              blurb: "Invoices and payments" },
      { k: "books",      label: "Books",              wing: "business", href: "barry-books.html",                    icon: "birdseye/icons/books.svg",                 blurb: "The ledger, cash basis" },
      { k: "dispensary", label: "Dispensary",         wing: "business", href: "barry-dispensary.html",               icon: "birdseye/icons/dispensary.svg",            blurb: "Supplement orders and the catalog" },
      { k: "services",   label: "Services",           wing: "business", href: "barry-burris-hub.html#services",      icon: "birdseye/icons/finance-and-products.svg",  blurb: "Your services and memberships" },
      { k: "briefs",     label: "Briefs from AE",     wing: "grow",     href: "bb-briefs.html",                      icon: "birdseye/icons/brief.svg",                 blurb: "Market intelligence for the practice", short: "Briefs" },
      { k: "growth",     label: "Growth",             wing: "grow",     href: "barry-burris-hub.html#growth",        icon: "birdseye/icons/growth.svg",                blurb: "Leads and reviews" },
      { k: "directory",  label: "Directory",          wing: "grow",     href: "barry-directory.html",                icon: "birdseye/icons/referral-crm.svg",          blurb: "The referral network" },
      { k: "protocols",  label: "Protocols",          wing: "grow",     href: "barry-burris-hub.html#protocols",     icon: "birdseye/icons/manual.svg",                blurb: "Your clinical protocol library" },
      { k: "team",       label: "Team",               wing: "practice", href: "barry-burris-hub.html#team",          icon: "birdseye/icons/team.svg",                  blurb: "Staff and what each can open" },
      { k: "profile",    label: "Profile",            wing: "practice", href: "barry-burris-hub.html#profile",       icon: "birdseye/icons/setup.svg",                 blurb: "Practice details and settings" },
      { k: "privacy",    label: "Privacy & Security", wing: "practice", href: "bb-privacy.html",                     icon: "birdseye/icons/privacy.svg",               blurb: "How patient data is protected", short: "Privacy" }
    ],

    /* SEATS — the jobs in a naturopathic clinic, mirroring the roles in bb-auth.js (owner, provider, front desk /
       phlebotomist, assistant). The patient never gets a seat: the portal stays its own side. */
    defaultSeat: "doctor",
    seats: {
      doctor: { label: "Dr. Burris", sees: "*", money: true,
        plan: ["calendar", "intakes", "charting", "labs", "checkins", "dispensary", "contacts", "briefs"],
        small: ["billing", "books", "telehealth", "protocols"], dock: ["calendar", "checkins"],
        prime: { label: "Start a video visit", href: "telehealth.html?room=BBNMD-office-rothco&name=Barry+Burris,+NMD", room: "telehealth" } },
      frontdesk: { label: "Front desk", money: true,
        sees: ["calendar", "contacts", "intakes", "checkins", "labs", "billing", "records", "portal", "dispensary", "docs", "services", "telehealth", "directory", "privacy"],
        plan: ["calendar", "contacts", "intakes", "checkins", "labs", "billing", "records", "portal"],
        small: ["dispensary", "docs", "services", "telehealth"], dock: ["calendar", "contacts"],
        prime: { label: "Book the next appointment", href: "barry-calendar.html", room: "calendar" } },
      dispensary: { label: "Dispensary", money: false,
        sees: ["dispensary", "labs", "calendar", "checkins", "contacts", "records", "protocols", "intakes", "docs", "portal", "telehealth", "privacy"],
        plan: ["dispensary", "labs", "calendar", "checkins", "contacts", "records", "protocols", "intakes"],
        small: ["docs", "portal", "telehealth", "privacy"], dock: ["dispensary", "labs"],
        prime: { label: "Fill the next supplement order", href: "barry-dispensary.html", room: "dispensary" } },
      clinician: { label: "Clinician", money: false,
        sees: ["calendar", "charting", "intakes", "labs", "checkins", "records", "telehealth", "protocols", "contacts", "docs", "dispensary", "portal", "privacy"],
        plan: ["calendar", "charting", "intakes", "labs", "checkins", "records", "telehealth", "protocols"],
        small: ["contacts", "docs", "dispensary", "portal"], dock: ["charting", "labs"],
        prime: { label: "Chart the visit — SOAP note", href: "soap-note-generator-prototype.html", room: "charting" } }
    },

    figures: {
      calendar:   { money: false, source: "api:calendar events[start=today]", fn: function (E, D, H) { var d = dayEvents(D, H); return d ? [d.length, "visit{s} on the calendar today"] : undefined; } },
      telehealth: { money: false, source: "api:calendar events[start=today, mode/type=video]", fn: function (E, D, H) { var d = dayEvents(D, H); return d ? [d.filter(tele).length, "video visit{s} today"] : undefined; } },
      checkins:   { money: false, source: "api:checkins inbox threads[lastFrom=patient]", fn: function (E, D) { var w = waiting(D); return w ? [w.length, "waiting on your reply"] : undefined; } },
      intakes:    { money: false, source: "device:bb_uploaded_intakes (filed questionnaires; the SAMPLE roster is not counted)", fn: function (E, D) { return [D.intakes.length, "questionnaire{s} filed"]; } },
      contacts:   { money: false, source: "api:contacts list (count)", fn: function (E, D) { return D.contactsN != null ? [D.contactsN, "contact{s} on file"] : undefined; } },
      records:    { money: false, source: "device:bb_records", fn: function (E, D) { return [D.records.length, "file{s} in the cabinet"]; } },
      labs:       { money: false, source: "device:bb_labs[st≠Resulted]", fn: function (E, D) { return [labsOpen(D).length, "awaiting results"]; } },
      docs:       { money: false, source: "api:docs list (count)", fn: function (E, D) { return D.docsN != null ? [D.docsN, "document{s} saved"] : undefined; } },
      billing:    { money: true,  source: "device:bb_invoices[st≠ok].amt", fn: function (E, D, H) { var o = openInv(D); return [H.money(H.sum(o, function (i) { return i.amt; })), "outstanding · " + H.p(o.length, "open invoice{s}")]; } },
      books:      { money: true,  source: "api:books pnl.netIncome (cash basis, to date)", fn: function (E, D, H) { return D.books && D.books.pnl ? [H.money(D.books.pnl.netIncome), "net income to date"] : undefined; } },
      dispensary: { money: false, source: "api:dispensary orders[status=new/paid/fulfilling]", fn: function (E, D) { var o = toFill(D); return o ? [o.length, "order{s} to fill"] : undefined; } },
      briefs:     { money: false, source: "config.latestBrief vs device:bb_briefs_seen", fn: function (E, D, H) { var L = window.BIRDSEYE.latestBrief; return D.briefSeen === L ? [H.date(L), "latest brief from AE"] : [1, "new brief from AE to read"]; } },
      growth:     { money: false, source: "device:bb_leads[st=new]", fn: function (E, D) { return [newLeads(D).length, "new lead{s} to follow up"]; } },
      team:       { money: false, source: "device:bb_team", fn: function (E, D) { return [D.team.length, "team member{s} added"]; } }
    },

    center: function (E, D, H) {
      var d = dayEvents(D, H), w = waiting(D);
      if (!d) return { big: "—", line: E.loaded() ? "The calendar is not reachable right now" : "Reading today's calendar…", tone: "" };
      return { big: d.length + " TODAY", line: w ? H.p(w.length, "check-in{s} waiting on you") : H.p(d.filter(tele).length, "by video"), tone: w && w.length ? "warn" : "ok" };
    },

    needs: function (E, D, H, S) {
      var o = [], w = waiting(D), f = toFill(D), l = labsOpen(D), inv = openInv(D), nl = newLeads(D);
      if (w && w.length) o.push(["bad", H.n(w.length, "patient check-in") + " waiting on your reply", "checkins"]);
      if (f && f.length) o.push(["warn", H.n(f.length, "supplement order") + " to fill", "dispensary"]);
      if (l.length) o.push(["warn", H.n(l.length, "lab order") + " awaiting results", "labs"]);
      if (D.intakes.length) o.push(["warn", H.n(D.intakes.length, "filed questionnaire") + " to review", "intakes"]);
      if (S.money && inv.length) o.push(["warn", H.n(inv.length, "invoice") + " open, " + H.money(H.sum(inv, function (i) { return i.amt; })) + " outstanding", "billing"]);
      if (D.briefSeen !== window.BIRDSEYE.latestBrief) o.push(["warn", "A new brief from AE is waiting", "briefs"]);
      if (nl.length) o.push(["warn", H.n(nl.length, "new lead") + " to follow up", "growth"]);
      return o;
    },

    bus: function (E, D, H) {
      var t = today(H), out = [], d = dayEvents(D, H) || [];
      d.forEach(function (e) { out.push([tm(e) === "All day" ? "All day" : H.hm(tm(e)), (e.title || "Visit") + (e.type ? " · " + e.type : "") + (tele(e) ? " · video" : "")]); });
      (D.threads || []).forEach(function (th) { if (th.lastTs && H.iso(new Date(th.lastTs)) === t) { var dt = new Date(th.lastTs); out.push([H.hm(String(dt.getHours()).padStart(2, "0") + ":" + String(dt.getMinutes()).padStart(2, "0")), "Check-in " + (th.lastFrom === "patient" ? "from " : "to ") + (th.name || "a patient")]); } });
      return out;
    },

    glance: function (E, D, H, S) {
      var d = dayEvents(D, H), w = waiting(D), f = toFill(D), l = labsOpen(D);
      var lede = [];
      if (d) lede.push(H.n(d.length, "visit") + " on the calendar today" + (d.filter(tele).length ? ", " + d.filter(tele).length + " by video" : "") + ".");
      if (w) lede.push(H.n(w.length, "patient check-in") + " waiting on a reply.");
      if (f) lede.push(H.n(f.length, "supplement order") + " to fill.");
      lede.push(H.n(l.length, "lab order") + " awaiting results on this device.");
      if (S.money && D.books && D.books.pnl) lede.push("The books show " + H.money(D.books.pnl.netIncome) + " net income to date, cash basis.");
      return {
        lede: lede.join(" "),
        numbers: [
          d ? [d.length, "visits today", "calendar"] : null,
          w ? [w.length, "check-ins waiting", "checkins"] : null,
          f ? [f.length, "orders to fill", "dispensary"] : null,
          [l.length, "labs awaiting results", "labs"],
          S.money && D.books && D.books.pnl ? [H.money(D.books.pnl.netIncome), "net income to date", "books", true] : (D.contactsN != null ? [D.contactsN, "contacts on file", "contacts"] : null),
          [D.intakes.length, "questionnaires filed", "intakes"]
        ].filter(Boolean),
        sections: [
          { title: "The day, visit by visit", empty: d ? "Nothing on the calendar today." : "The calendar is not reachable right now.", right: d ? H.n(d.length, "visit") : "",
            rows: T(function () { return (d || []).slice(0, 14).map(function (e) { return [tele(e) ? "telehealth" : "calendar", tm(e) === "All day" ? "All day" : H.hm(tm(e)), (e.title || "Visit") + (e.type ? " · " + e.type : "") + (tele(e) ? " · video" : "")]; }); }) || [] },
          { title: "Waiting on you", empty: w ? "No patient check-ins waiting." : "Check-ins are not reachable right now.", right: "",
            rows: T(function () { return (w || []).slice(0, 8).map(function (th) { return ["checkins", th.name || "A patient", (th.lastNote || "Check-in") + (th.lastTs ? " · " + H.date(new Date(th.lastTs).toISOString()) : "")]; }); }) || [] },
          { title: "Everything going on", empty: "", right: "",
            rows: T(function () { var r = [["labs", "Labs", H.n(l.length, "order") + " awaiting results"], ["intakes", "Intakes", H.n(D.intakes.length, "questionnaire") + " filed for review"]];
              if (f) r.push(["dispensary", "Dispensary", H.n(f.length, "order") + " to fill"]);
              if (D.contactsN != null) r.push(["contacts", "Contacts", H.n(D.contactsN, "contact") + " on file"]);
              if (S.money && D.books && D.books.pnl) r.push(["books", "Books", H.money(D.books.pnl.totalIncome) + " income, " + H.money(D.books.pnl.netIncome) + " net, cash basis", true]);
              return r; }) || [] }
        ]
      };
    },

    /* the helper keeps the name of Barry's own AI helper; the drawer opens Brian himself (bb-birdseye.js adds the button)
       and answers by hand from the room list when he is not on the page */
    helper: { name: "Brian", role: "Your helper · ask in plain words", hello: "Ask where something lives — visits, check-ins, labs, the dispensary, billing. For a full answer, talk to Brian.",
      ask: function (E, D, H, q) {
        var C = window.BIRDSEYE, B = window.BirdseyeShell, s = String(q || "").toLowerCase(), hits = [];
        var MAP = [[/visit|appoint|schedul|book|calendar/, "calendar"], [/video|tele|vietnam|interpret|translat|call/, "telehealth"], [/check.?in|message/, "checkins"], [/intake|questionnaire|new patient/, "intakes"],
          [/soap|chart|note/, "charting"], [/lab|result|marker|blood/, "labs"], [/supplement|dispens|order|catalog/, "dispensary"], [/invoice|bill|pay|charge/, "billing"], [/book|ledger|tax|income|profit/, "books"],
          [/contact|patient list|crm/, "contacts"], [/referr|directory|network/, "directory"], [/record|file|upload/, "records"], [/document|letter/, "docs"], [/brief|market|competit/, "briefs"],
          [/protocol|reset|peptide|hormone/, "protocols"], [/lead|review|grow|market/, "growth"], [/team|staff|employee|role/, "team"], [/privacy|hipaa|secur/, "privacy"], [/portal/, "portal"], [/service|price|membership/, "services"], [/profile|setting/, "profile"]];
        MAP.forEach(function (m) { if (m[0].test(s) && B.canOpen(m[1]) && hits.indexOf(m[1]) < 0) hits.push(m[1]); });
        if (!hits.length) return "That one is for Brian — tap “Talk to Brian” at the top of this drawer for a full answer. Everything else is one tap away under More.";
        return hits.slice(0, 3).map(function (k) { var r = B.room(k), f = B.figure(k); return { t: r.label, b: (f[0] !== "" ? f[0] + " " : "") + f[1] + ". Open it from the floor plan or under More." }; });
      } }
  };
})();

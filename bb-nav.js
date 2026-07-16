/* bb-nav.js — shared left sidebar for the Barry Burris, NMD practice hub.
   Injects a sidebar visually identical to barry-burris-hub.html onto any
   standalone page that includes this file, plus a mobile burger + scrim.

   Usage (place near the end of <body>):
     <script>window.BB_NAV_ACTIVE='calendar'</script>
     <script src="bb-nav.js"></script>
   BB_NAV_ACTIVE keys: home, calendar, contacts, charting,
                       billing, services, labs, protocols, growth, team, profile.

   Presentation only — it appends its own fixed sidebar and pushes page
   content right on desktop (body padding-left) / overlays on mobile.
   Every class is namespaced under #bb-side so it never collides with a
   page's own .nav / .side / .brand / .foot / .wrap styles.

   Built by Accelerated Experiences, LLC.
*/
(function () {
  if (window.__bbNavLoaded) return;
  window.__bbNavLoaded = true;

  // The BB coin — identical data-URI used across the other pages.
  var COIN = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20100%20100'%3E%3Cdefs%3E%3ClinearGradient%20id='g'%20x1='0'%20y1='0'%20x2='0'%20y2='1'%3E%3Cstop%20offset='0'%20stop-color='%23f4e0a6'/%3E%3Cstop%20offset='.5'%20stop-color='%23c6a04a'/%3E%3Cstop%20offset='1'%20stop-color='%238f6f2e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle%20cx='50'%20cy='50'%20r='49'%20fill='%230e1d30'/%3E%3Ccircle%20cx='50'%20cy='50'%20r='45'%20fill='none'%20stroke='url(%23g)'%20stroke-width='2.4'/%3E%3Ccircle%20cx='50'%20cy='50'%20r='40'%20fill='none'%20stroke='url(%23g)'%20stroke-width='1'/%3E%3Ctext%20x='50'%20y='64'%20font-family='Georgia,serif'%20font-size='41'%20font-weight='700'%20fill='url(%23g)'%20text-anchor='middle'%3EBB%3C/text%3E%3C/svg%3E";

  // Line-icon set (same paths as the hub's ICN).
  var ICN = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    cal: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
    users: '<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c0-3.4 3-6 6.5-6s6.5 2.6 6.5 6"/><path d="M16.5 4a3 3 0 010 5.6"/><path d="M22 20c0-2.6-1.6-4.6-4-5.4"/>',
    clip: '<rect x="5" y="4" width="14" height="17" rx="2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M8 11h8M8 15h6"/>',
    dollar: '<path d="M12 2v20"/><path d="M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.9 7 7s2.2 3 5 3.5 5 1.4 5 3.5-2.2 3.5-5 3.5-5-1.1-5-3"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 19l-5.4 2.8 1-6.1L3.2 9.5l6.1-.9z"/>',
    flask: '<path d="M9 3h6M10 3v6l-5.2 9.2A2 2 0 006.6 21h10.8a2 2 0 001.8-2.8L14 9V3"/><path d="M7 15h10"/>',
    book: '<path d="M4 4h8a3 3 0 013 3v14a3 3 0 00-3-2.6H4z"/><path d="M20 4h-4a3 3 0 00-3 3v14a3 3 0 013-2.6h4z"/>',
    team: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 2.7-5 6-5s6 2 6 5"/><path d="M17 9.5a2.6 2.6 0 000-4"/><path d="M21 20c0-2.3-1.4-4-3.5-4.6"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.1 5.1l2.1 2.1M16.8 16.8l2.1 2.1M18.9 5.1l-2.1 2.1M7.2 16.8l-2.1 2.1"/>'
  };

  // Nav groups: [key, label, icon, url]. Internal hub views are reached
  // via URL hash — the hub routes on load from location.hash.
  var NAV = [
    { g: 'Practice', items: [
      ['home', 'Home', 'home', 'barry-burris-hub.html'],
      ['calendar', 'Calendar', 'cal', 'barry-calendar.html'],
      ['contacts', 'Contacts', 'users', 'barry-contacts.html'],
      ['charting', 'Charting', 'clip', 'barry-burris-hub.html#charting']
    ] },
    { g: 'Business', items: [
      ['billing', 'Billing', 'dollar', 'barry-burris-hub.html#billing'],
      ['services', 'Services', 'star', 'barry-burris-hub.html#services'],
      ['labs', 'Labs', 'flask', 'barry-burris-hub.html#labs']
    ] },
    { g: 'Grow', items: [
      ['protocols', 'Protocols', 'book', 'barry-burris-hub.html#protocols'],
      ['growth', 'Growth', 'trend', 'barry-burris-hub.html#growth'],
      ['team', 'Team', 'team', 'barry-burris-hub.html#team'],
      ['profile', 'Profile', 'gear', 'barry-burris-hub.html#profile']
    ] }
  ];

  var CSS = [
    "#bb-side,#bb-side *{box-sizing:border-box}",
    "#bb-side{position:fixed;top:0;left:0;width:252px;height:100vh;z-index:15;display:flex;flex-direction:column;background:linear-gradient(180deg,#16171d,#101116);color:#f4e8d0;border-right:1px solid #25262e;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;transform:translateX(0);transition:transform .22s ease}",
    "#bb-side .bbn-brand{display:flex;align-items:center;gap:11px;padding:20px 16px 14px}",
    "#bb-side .bbn-brand img{width:42px;height:42px;border-radius:50%;flex:none;box-shadow:0 0 0 1px rgba(230,198,126,.35)}",
    "#bb-side .bbn-bn{font-family:Fraunces,Georgia,serif;font-weight:700;font-size:18px;color:#e6c67e;line-height:1.06;letter-spacing:-.01em}",
    "#bb-side .bbn-bt{font-family:Oswald,sans-serif;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#9a8a6a;margin-top:3px}",
    "#bb-side .bbn-nav{flex:1;overflow-y:auto;padding:6px 12px}",
    "#bb-side .bbn-grp{font-family:Oswald,sans-serif;font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:#9a8a6a;margin:15px 8px 5px;padding-top:12px;border-top:1px solid #1f2027}",
    "#bb-side .bbn-grp:first-child{margin-top:4px;padding-top:0;border-top:none}",
    "#bb-side a.bbn-link{display:flex;align-items:center;gap:11px;padding:9px 12px;border-radius:9px;color:#cdbfa4;text-decoration:none;font-family:Oswald,sans-serif;font-weight:500;font-size:13px;letter-spacing:.045em;text-transform:uppercase;margin:2px 0;cursor:pointer;transition:background .15s,color .15s}",
    "#bb-side a.bbn-link:hover{background:rgba(255,255,255,.06);color:#fff}",
    "#bb-side a.bbn-link.active{background:linear-gradient(90deg,rgba(230,198,126,.16),rgba(230,198,126,.02));color:#f4e8d0;box-shadow:inset 3px 0 0 #e6c67e}",
    "#bb-side a.bbn-link svg{width:18px;height:18px;flex:none;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}",
    "#bb-side .bbn-foot{padding:13px 16px;border-top:1px solid #25262e;font-size:10.5px;color:#8f8267;line-height:1.5}",
    "#bb-side .bbn-foot b{color:#e6c67e;font-weight:600}",
    "#bb-burger{display:none;position:fixed;top:12px;left:12px;z-index:1150;width:42px;height:42px;align-items:center;justify-content:center;padding:0;border:1px solid #e8dcc4;background:#fffdf7;color:#0e7c84;border-radius:10px;cursor:pointer;box-shadow:0 4px 14px rgba(60,40,20,.16)}",
    "#bb-burger:hover{background:#f4ecdb;border-color:#e6c67e}",
    "#bb-scrim{display:none;position:fixed;inset:0;background:rgba(15,25,40,.5);z-index:1190}",
    "#bb-scrim.on{display:block}",
    "@media(min-width:901px){body{padding-left:252px;box-sizing:border-box}}",
    "@media(max-width:900px){#bb-side{z-index:1200;transform:translateX(-100%);box-shadow:2px 0 22px rgba(0,0,0,.4)}#bb-side.open{transform:translateX(0)}#bb-burger{display:flex}}",
    "@media print{#bb-side,#bb-burger,#bb-scrim{display:none!important}body{padding-left:0!important}}"
  ].join("\n");

  function ensureFonts() {
    if (document.querySelector('link[href*="fonts.googleapis.com/css2"]')) return;
    var pc1 = document.createElement('link');
    pc1.rel = 'preconnect'; pc1.href = 'https://fonts.googleapis.com';
    var pc2 = document.createElement('link');
    pc2.rel = 'preconnect'; pc2.href = 'https://fonts.gstatic.com'; pc2.crossOrigin = '';
    var f = document.createElement('link');
    f.rel = 'stylesheet';
    f.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap';
    document.head.appendChild(pc1);
    document.head.appendChild(pc2);
    document.head.appendChild(f);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function build() {
    if (document.getElementById('bb-side')) return;
    ensureFonts();

    var style = document.createElement('style');
    style.id = 'bb-nav-style';
    style.textContent = CSS;
    document.head.appendChild(style);

    var active = String(window.BB_NAV_ACTIVE || '').trim();

    var html = '<div class="bbn-brand">' +
      '<img src="' + COIN + '" alt="BB coin">' +
      '<div><div class="bbn-bn">Barry Burris</div><div class="bbn-bt">NMD &middot; Functional Medicine</div></div>' +
      '</div><nav class="bbn-nav" aria-label="Sections">';
    for (var i = 0; i < NAV.length; i++) {
      html += '<div class="bbn-grp">' + esc(NAV[i].g) + '</div>';
      var items = NAV[i].items;
      for (var j = 0; j < items.length; j++) {
        var k = items[j][0], label = items[j][1], ic = items[j][2], url = items[j][3];
        var cls = 'bbn-link' + (k === active ? ' active' : '');
        var cur = (k === active) ? ' aria-current="page"' : '';
        html += '<a class="' + cls + '" href="' + url + '"' + cur + '>' +
          '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICN[ic] || '') + '</svg>' +
          '<span>' + esc(label) + '</span></a>';
      }
    }
    html += '</nav><div class="bbn-foot">Barry Burris, NMD &middot; Functional Medicine &amp; Longevity<br>Built by <b>Accelerated Experiences, LLC</b></div>';

    var aside = document.createElement('aside');
    aside.id = 'bb-side';
    aside.setAttribute('aria-label', 'Practice navigation');
    aside.innerHTML = html;

    var burger = document.createElement('button');
    burger.id = 'bb-burger';
    burger.type = 'button';
    burger.setAttribute('aria-label', 'Open navigation menu');
    burger.setAttribute('aria-expanded', 'false');
    burger.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';

    var scrim = document.createElement('div');
    scrim.id = 'bb-scrim';

    document.body.appendChild(aside);
    document.body.appendChild(burger);
    document.body.appendChild(scrim);

    function open() {
      aside.classList.add('open');
      scrim.classList.add('on');
      burger.setAttribute('aria-expanded', 'true');
    }
    function close() {
      aside.classList.remove('open');
      scrim.classList.remove('on');
      burger.setAttribute('aria-expanded', 'false');
    }
    burger.addEventListener('click', function () {
      if (aside.classList.contains('open')) close(); else open();
    });
    scrim.addEventListener('click', close);
    var links = aside.querySelectorAll('.bbn-link');
    for (var n = 0; n < links.length; n++) links[n].addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();

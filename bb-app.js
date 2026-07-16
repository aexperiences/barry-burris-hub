/* bb-app.js — the "native app" shell for the Barry Burris, NMD system.
   ONE file, included on every page. It:
     1) makes the site installable (PWA: manifest + service worker + iOS meta),
        themed RED on the staff side and SAGE on the patient side;
     2) adds a fixed bottom TAB BAR on phones/tablets (staff side) so it feels
        like a native app, with a "More" tab that opens the full menu;
     3) adds a slim "Install app" banner when the device offers it.
   Presentation only. Never touches /api, Jitsi, or page logic.
   Built by Accelerated Experiences, LLC. */
(function () {
  if (window.__bbApp) return; window.__bbApp = true;

  var PATIENT = /patient/i.test(location.pathname);
  var THEME = PATIENT
    ? { color: '#4a6b52', color2: '#3d5a45', title: 'BB Portal', manifest: 'manifest-patient.webmanifest' }
    : { color: '#95463f', color2: '#763530', title: 'BB Practice', manifest: 'manifest.webmanifest' };

  var head = document.head || document.getElementsByTagName('head')[0];
  function addHead(html) { head.insertAdjacentHTML('beforeend', html); }
  function has(sel) { return !!document.querySelector(sel); }

  /* ---------- 1. PWA head tags ---------- */
  if (!has('link[rel="manifest"]')) addHead('<link rel="manifest" href="' + THEME.manifest + '">');
  if (!has('meta[name="theme-color"]')) addHead('<meta name="theme-color" content="' + THEME.color + '">');
  if (!has('link[rel="apple-touch-icon"]')) addHead('<link rel="apple-touch-icon" href="apple-touch-icon.png">');
  addHead('<meta name="apple-mobile-web-app-capable" content="yes">');
  addHead('<meta name="mobile-web-app-capable" content="yes">');
  addHead('<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">');
  addHead('<meta name="apple-mobile-web-app-title" content="' + THEME.title + '">');

  /* ---------- 2. Service worker (installability + speed) ---------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  /* ---------- 3. Mobile shell CSS ---------- */
  var GOLD = '#e6c67e';
  var css = [
    '.bb-tabbar{display:none;position:fixed;left:0;right:0;bottom:0;z-index:1201;',
    'background:linear-gradient(180deg,' + THEME.color + ',' + THEME.color2 + ');',
    'padding-bottom:env(safe-area-inset-bottom);box-shadow:0 -6px 22px rgba(0,0,0,.16);border-top:1px solid rgba(255,255,255,.10)}',
    '.bb-tabbar a{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;',
    'padding:8px 2px 6px;min-height:58px;color:rgba(255,255,255,.74);text-decoration:none;',
    "font:600 10.5px/1.05 Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:.01em;",
    '-webkit-tap-highlight-color:transparent;position:relative;cursor:pointer}',
    '.bb-tabbar a svg{width:23px;height:23px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    '.bb-tabbar a.on{color:#fff}',
    '.bb-tabbar a.on::before{content:"";position:absolute;top:0;left:50%;transform:translateX(-50%);width:26px;height:3px;border-radius:0 0 3px 3px;background:' + GOLD + '}',
    '.bb-tabbar a:active{background:rgba(0,0,0,.14)}',
    '.bb-scrim{position:fixed;inset:0;background:rgba(20,12,10,.44);z-index:1150;opacity:0;pointer-events:none;transition:opacity .24s}',
    'body.bb-open .bb-scrim{opacity:1;pointer-events:auto}',
    '.bb-install{display:none;position:fixed;left:10px;right:10px;bottom:calc(66px + env(safe-area-inset-bottom));z-index:1202;',
    'background:#fffdf7;border:1px solid #e8dcc4;border-radius:14px;box-shadow:0 10px 30px rgba(60,40,20,.22);',
    'padding:11px 12px;align-items:center;gap:11px;font:500 13px/1.3 Inter,system-ui,sans-serif;color:#3a2c18}',
    '.bb-install img{width:34px;height:34px;border-radius:8px;flex:none}',
    '.bb-install .bb-x{margin-left:2px;background:transparent;border:0;color:#9a8a6a;font-size:18px;line-height:1;cursor:pointer;padding:2px 6px}',
    '.bb-install .bb-go{background:linear-gradient(180deg,' + THEME.color + ',' + THEME.color2 + ');color:#fff;border:0;border-radius:9px;padding:8px 14px;font:600 13px Inter,sans-serif;cursor:pointer;white-space:nowrap}',
    '@media(max-width:900px){',
    '  body.bb-staff .bb-tabbar{display:flex}',
    '  body.bb-staff{padding-bottom:calc(60px + env(safe-area-inset-bottom))!important}',
    '  body.bb-host .app{display:block}',
    '  body.bb-host .main{margin-left:0!important}',
    '  body.bb-host .side{position:fixed!important;top:0;left:0;height:100%!important;width:84vw!important;max-width:300px;',
    '     z-index:1200!important;transform:translateX(-102%);transition:transform .24s ease;box-shadow:2px 0 30px rgba(0,0,0,.4)}',
    '  body.bb-host.bb-open .side{transform:none}',
    '  body.bb-host .burger{display:none!important}',
    '  body.bb-install-on .bb-install{display:flex}',
    '}',
    '@media(min-width:901px){.bb-tabbar{display:none!important}.bb-scrim{display:none!important}.bb-install{display:none!important}}',
    '@media print{.bb-tabbar,.bb-scrim,.bb-install{display:none!important}}'
  ].join('');
  var st = document.createElement('style'); st.id = 'bb-app-style'; st.textContent = css; head.appendChild(st);

  /* ---------- 4. Bottom tab bar (staff side) ---------- */
  var ICN = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    cal: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
    users: '<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c0-3.4 3-6 6.5-6s6.5 2.6 6.5 6"/><path d="M16.5 4a3 3 0 010 5.6"/><path d="M22 20c0-2.6-1.6-4.6-4-5.4"/>',
    clip: '<rect x="5" y="4" width="14" height="17" rx="2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M8 11h8M8 15h6"/>',
    menu: '<path d="M3 6h18M3 18h18M3 12h18"/>'
  };
  var STAFF_TABS = [
    { ic: 'home', label: 'Home', href: 'barry-burris-hub.html', match: /(^|\/)(barry-burris-hub|index)\.html$|\/$/ },
    { ic: 'cal', label: 'Calendar', href: 'barry-calendar.html', match: /barry-calendar\.html/ },
    { ic: 'users', label: 'People', href: 'barry-contacts.html', match: /barry-contacts\.html/ },
    { ic: 'clip', label: 'Charting', href: 'soap-note-generator-prototype.html', match: /soap-note-generator/ },
    { ic: 'menu', label: 'More', more: true }
  ];

  function svg(p) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>'; }

  function buildTabbar() {
    if (PATIENT) return;                 // patient portal = PWA only (already mobile-friendly)
    if (document.querySelector('.bb-tabbar')) return;
    document.body.classList.add('bb-staff');
    var isHub = !!document.querySelector('.app .side');   // the hub owns its own .side drawer
    if (isHub) document.body.classList.add('bb-host');

    var path = location.pathname;
    var bar = document.createElement('nav');
    bar.className = 'bb-tabbar'; bar.setAttribute('aria-label', 'App tabs');
    var html = '';
    for (var i = 0; i < STAFF_TABS.length; i++) {
      var t = STAFF_TABS[i];
      var on = t.match && t.match.test(path) ? ' on' : '';
      if (t.more) {
        html += '<a class="bb-more" href="#" role="button" aria-label="More menu">' + svg(ICN[t.ic]) + '<span>' + t.label + '</span></a>';
      } else {
        html += '<a class="' + ('bb-tab' + on) + '" href="' + t.href + '">' + svg(ICN[t.ic]) + '<span>' + t.label + '</span></a>';
      }
    }
    bar.innerHTML = html;
    document.body.appendChild(bar);

    // scrim for the hub-managed drawer
    var scrim = document.createElement('div'); scrim.className = 'bb-scrim';
    document.body.appendChild(scrim);

    function closeDrawer() { document.body.classList.remove('bb-open'); }
    scrim.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });

    bar.querySelector('.bb-more').addEventListener('click', function (e) {
      e.preventDefault();
      var burg = document.getElementById('bb-burger');      // dept pages (bb-nav.js) own drawer
      if (burg) { burg.click(); return; }
      document.body.classList.toggle('bb-open');             // hub off-canvas
    });
    // close the hub drawer after choosing something in it
    var side = document.querySelector('.app .side');
    if (side) side.addEventListener('click', function (e) {
      if (e.target.closest('a,button')) closeDrawer();
    });
  }

  /* ---------- 5. Install banner ---------- */
  function setupInstall() {
    if (localStorage.getItem('bb_install_dismissed') === '1') return;
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault(); window.__bbPrompt = e;
      var b = document.createElement('div'); b.className = 'bb-install';
      b.innerHTML = '<img src="icon-192.png" alt=""><div style="flex:1">Install <b>' + THEME.title +
        '</b> for a full-screen, one-tap app.</div>' +
        '<button class="bb-go">Install</button><button class="bb-x" aria-label="Dismiss">&times;</button>';
      document.body.appendChild(b);
      document.body.classList.add('bb-install-on');
      b.querySelector('.bb-go').addEventListener('click', function () {
        b.style.display = 'none';
        window.__bbPrompt.prompt();
        window.__bbPrompt.userChoice.finally(function () { document.body.classList.remove('bb-install-on'); });
      });
      b.querySelector('.bb-x').addEventListener('click', function () {
        document.body.classList.remove('bb-install-on');
        localStorage.setItem('bb_install_dismissed', '1');
      });
    });
  }

  function start() { try { buildTabbar(); } catch (e) {} try { setupInstall(); } catch (e) {} }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

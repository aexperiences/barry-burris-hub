/* sw.js — Barry Burris, NMD practice app shell.
   Makes the hub installable + fast, WITHOUT ever interfering with the live
   APIs (draft/translate), Jitsi video, or fonts. Network-first for pages so
   deploys always show fresh; cache-first for static assets; offline fallback.
   Built by Accelerated Experiences, LLC. */
var CACHE = 'bb-app-v1';
var SHELL = [
  '/barry-burris-hub.html', '/manifest.webmanifest',
  '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/bee-coin.svg',
  '/bb-nav.js', '/bb-app.js'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL).catch(function () {}); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== self.location.origin) return;      // leave APIs/CDN/Jitsi/fonts untouched
  if (url.pathname.indexOf('/api/') === 0) return;       // NEVER cache the AI/translate endpoints

  var isHTML = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').indexOf('text/html') !== -1;

  if (isHTML) {
    // network-first: fresh deploys win; fall back to cache, then the hub shell
    e.respondWith(
      fetch(req).then(function (r) {
        var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); });
        return r;
      }).catch(function () {
        return caches.match(req).then(function (m) { return m || caches.match('/barry-burris-hub.html'); });
      })
    );
    return;
  }
  // cache-first for static assets (icons, js, svg, css)
  e.respondWith(
    caches.match(req).then(function (m) {
      return m || fetch(req).then(function (r) {
        var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); });
        return r;
      });
    })
  );
});

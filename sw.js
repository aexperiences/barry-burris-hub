/* sw.js — Barry Burris, NMD practice app shell.
   Makes the hub installable + fast, WITHOUT ever interfering with the live
   APIs (draft/translate/assistant), video, or fonts. Network-first for pages so
   deploys always show fresh; stale-while-revalidate for static assets so a new
   deploy self-heals on the next load (no more frozen JS between deploys).
   Built by Accelerated Experiences, LLC. */
var CACHE = 'bb-app-v2';
var SHELL = [
  '/barry-burris-hub.html', '/manifest.webmanifest',
  '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/bee-coin.svg',
  '/bb-nav.js', '/bb-app.js', '/bb-assistant.js'
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
  // stale-while-revalidate for static assets (icons, js, svg, css):
  // serve the cached copy instantly when present, but ALWAYS refetch in the
  // background and update the cache, so the very next load picks up new JS.
  e.respondWith(
    caches.match(req).then(function (m) {
      var fetching = fetch(req).then(function (r) {
        if (r && r.status === 200 && r.type === 'basic') {
          var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); });
        }
        return r;
      }).catch(function () { return m; });
      return m || fetching;
    })
  );
});

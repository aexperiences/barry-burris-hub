/* bb-translate.js — Barry Burris, NMD · client translation helper
   ---------------------------------------------------------------
   Barry writes in English; international patients read in their language.
   Calls /api/translate (DeepSeek/Anthropic on the backend), caches results in
   localStorage, and DEGRADES GRACEFULLY: if the API is unavailable it simply
   returns the original text — the app never breaks, it just shows English.

     BBTranslate.to(text, 'vi')        -> Promise<string>
     BBTranslate.batch([...], 'vi')    -> Promise<string[]>   (one call for the misses)
     BBTranslate.cachedOnly(text,'vi') -> string | null       (sync, cache only)

   Built by Accelerated Experiences, LLC.
*/
(function () {
  'use strict';
  var API = '/api/translate', CKEY = 'bb_tr_cache_v1', mem = null;

  function cache() { if (mem) return mem; try { mem = JSON.parse(localStorage.getItem(CKEY)) || {}; } catch (e) { mem = {}; } return mem; }
  function save() { try { localStorage.setItem(CKEY, JSON.stringify(mem)); } catch (e) {} }
  function key(to, text) { return to + '' + text; }

  function cachedOnly(text, to) { var c = cache(); var v = c[key(to, String(text == null ? '' : text))]; return v == null ? null : v; }

  function to(text, target) {
    text = String(text == null ? '' : text);
    if (!text.trim()) return Promise.resolve(text);
    var hit = cachedOnly(text, target); if (hit != null) return Promise.resolve(hit);
    return fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: text, to: target }) })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.ok && d.text) { var c = cache(); c[key(target, text)] = d.text; save(); return d.text; } return text; })
      .catch(function () { return text; });
  }

  function batch(texts, target) {
    texts = (texts || []).map(function (x) { return String(x == null ? '' : x); });
    var c = cache(), out = texts.slice(), miss = [], idx = [];
    texts.forEach(function (tx, i) { var h = c[key(target, tx)]; if (h != null) out[i] = h; else if (tx.trim()) { miss.push(tx); idx.push(i); } });
    if (!miss.length) return Promise.resolve(out);
    return fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ texts: miss, to: target }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ok && Array.isArray(d.items)) { d.items.forEach(function (tr, j) { if (tr) { out[idx[j]] = tr; c[key(target, miss[j])] = tr; } }); save(); }
        return out;
      })
      .catch(function () { return out; });
  }

  window.BBTranslate = { to: to, batch: batch, cachedOnly: cachedOnly };
})();

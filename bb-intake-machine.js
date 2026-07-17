/* bb-intake-machine.js — THE MACHINE.
 * Turns a questionnaire Barry received some other way (typed export, filled
 * PDF, plain-text/email answers, or a photo/scan of paper) into the exact
 * same intake payload patient-portal.html produces — so it flows into the
 * SOAP tool through the identical door. Needs bb-intake-schema.js loaded first.
 *
 * PHILOSOPHY (matches AEHub's other machines — Skin Machine, Hub Builder):
 * one engine, deterministic rules, config/knowledge baked in, no network
 * call unless the input genuinely requires one. In order of preference:
 *   1. JSON export of this exact schema           → zero network, instant.
 *   2. A PDF/text file with a real text layer      → local label-matching
 *      against the same bilingual questions the portal asks. Zero network.
 *   3. A photo or a scanned (image-only) PDF        → the ONLY case that
 *      needs an outside call. Gated on api/extract.mjs; if no key is set,
 *      the machine says so plainly and hands Barry a usable stub instead
 *      of guessing.
 *
 * HONESTY: never fabricates a score, medication, or diagnosis. A field it
 * can't read stays blank. Every result says which method produced it.
 */
(function (global) {
  'use strict';
  var S = global.BBIntakeSchema;

  function readAsText(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result || '')); };
      r.onerror = reject;
      r.readAsText(file);
    });
  }
  function readAsDataURL(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result || '')); };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  // ---- Path 1: JSON export (already this schema, or close to it) ----
  function fromJSON(text, meta) {
    var obj = null;
    try { obj = JSON.parse(text); } catch (e) { return null; }
    if (!obj || typeof obj !== 'object') return null;
    return S.normalize(obj, Object.assign({ method: 'json' }, meta));
  }

  // ---- Path 2: local label-matching over plain text (from a PDF text
  // layer, a .txt file, or pasted email text). This is the "knowledge"
  // the machine already has — Barry's own questionnaire's exact labels. ----
  function grabAfterLabel(text, label) {
    // Matches "Label (the other-language part) : value" up to end of line —
    // skips any bilingual parenthetical / punctuation between the label and
    // the actual separator. Deliberately conservative — requires an actual
    // ':' or '-' separator; returns '' (not a guess) if none follows.
    var esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var re = new RegExp(esc + '[^:\\-\\n]{0,80}[:\\-]\\s*(.+)', 'i');
    var m = text.match(re);
    if (!m) return '';
    return m[1].split(/\r?\n/)[0].trim().slice(0, 800);
  }
  function grabScore(text, label) {
    var esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var re = new RegExp(esc + '[^0-9\\n]{0,40}(\\d{1,2})\\s*(?:\\/\\s*10)?', 'i');
    var m = text.match(re);
    if (!m) return null;
    var n = Number(m[1]);
    return Number.isNaN(n) ? null : Math.max(0, Math.min(10, n));
  }
  function fromText(text, meta) {
    if (!text || text.trim().length < 20) return null;
    var L = S.LABELS;
    var p = S.EMPTY();
    p.name = grabAfterLabel(text, L.name.vi) || grabAfterLabel(text, L.name.en);
    p.dob = grabAfterLabel(text, L.dob.vi) || grabAfterLabel(text, L.dob.en);
    p.sex = grabAfterLabel(text, L.sex.vi) || grabAfterLabel(text, L.sex.en);
    p.cc = grabAfterLabel(text, L.cc.en) || grabAfterLabel(text, L.cc.vi);
    p.meds = grabAfterLabel(text, L.meds.en) || grabAfterLabel(text, L.meds.vi);
    p.allergies = grabAfterLabel(text, L.allergies.en) || grabAfterLabel(text, L.allergies.vi);
    p.scores = {
      energy: grabScore(text, L.energy.en) || grabScore(text, L.energy.vi),
      sleep:  grabScore(text, L.sleep.en)  || grabScore(text, L.sleep.vi),
      mood:   grabScore(text, L.mood.en)   || grabScore(text, L.mood.vi),
      libido: grabScore(text, L.libido.en) || grabScore(text, L.libido.vi),
    };
    // A weak read (nothing legible at all) is worth flagging, not hiding.
    var gotAnything = p.name || p.cc || p.meds || p.allergies ||
      Object.values(p.scores).some(function (v) { return v != null; });
    if (!gotAnything) return null;
    return S.normalize(p, Object.assign({ method: 'text' }, meta));
  }

  // ---- Lazy-load pdf.js only when a PDF actually needs a local text read.
  // If it can't load (offline / blocked), the machine degrades to the
  // vision fallback rather than failing silently. ----
  var _pdfjsLoading = null;
  function ensurePdfJs() {
    if (global.pdfjsLib) return Promise.resolve(global.pdfjsLib);
    if (_pdfjsLoading) return _pdfjsLoading;
    _pdfjsLoading = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload = function () {
        try {
          global.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(global.pdfjsLib);
        } catch (e) { reject(e); }
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return _pdfjsLoading;
  }
  function pdfTextLayer(file) {
    return readAsDataURL(file).then(function (dataUrl) {
      var b64 = dataUrl.split(',')[1] || '';
      var bin = atob(b64);
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return ensurePdfJs().then(function (pdfjsLib) {
        return pdfjsLib.getDocument({ data: bytes }).promise.then(function (doc) {
          var pages = [];
          var chain = Promise.resolve();
          for (var n = 1; n <= Math.min(doc.numPages, 8); n++) {
            (function (n) {
              chain = chain.then(function () {
                return doc.getPage(n).then(function (pg) {
                  return pg.getTextContent().then(function (tc) {
                    pages.push(tc.items.map(function (it) { return it.str; }).join(' '));
                  });
                });
              });
            })(n);
          }
          return chain.then(function () { return pages.join('\n'); });
        });
      });
    }).catch(function () { return ''; });
  }

  // ---- Path 3 (last resort): a photo, or a PDF with no usable text layer
  // (a scan). Only path that reaches the internet — gated on api/extract. ----
  function fromVision(file, meta) {
    return readAsDataURL(file).then(function (dataUrl) {
      var b64 = (dataUrl.split(',')[1] || '');
      return fetch('/api/extract', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fileBase64: b64, mime: file.type || 'application/octet-stream', fileName: file.name || '' }),
      }).then(function (r) { return r.json().catch(function () { return { ok: false, reason: 'error' }; }); });
    }).then(function (res) {
      if (!res || !res.ok) {
        // Never guess. Hand back a usable, honest stub so the flow still works.
        var stub = S.EMPTY();
        stub.cc = 'Uploaded questionnaire could not be auto-read (' +
          ((res && res.reason) || 'unavailable') + ') — provider reviews the original file in Records: ' + (meta.sourceFile || file.name || '');
        return S.normalize(stub, Object.assign({ method: 'unreadable' }, meta));
      }
      return S.normalize(res.payload || res, Object.assign({ method: 'ai-vision' }, meta));
    }).catch(function () {
      var stub = S.EMPTY();
      stub.cc = 'Uploaded questionnaire could not be auto-read — provider reviews the original file in Records: ' + (meta.sourceFile || file.name || '');
      return S.normalize(stub, Object.assign({ method: 'unreadable' }, meta));
    });
  }

  // ---- Orchestrator ----
  function run(file, opts) {
    var meta = Object.assign({
      source: 'upload',
      sourceFile: file && file.name || '',
      sourceLabel: 'Uploaded by Barry — ' + ((file && file.name) || 'file'),
      submitted: new Date().toISOString().slice(0, 10),
    }, opts || {});

    var name = (file.name || '').toLowerCase();
    var isJSON = name.endsWith('.json') || file.type === 'application/json';
    var isPDF = name.endsWith('.pdf') || file.type === 'application/pdf';
    var isText = name.endsWith('.txt') || (file.type || '').indexOf('text/') === 0;
    var isImage = (file.type || '').indexOf('image/') === 0;

    if (isJSON) {
      return readAsText(file).then(function (t) {
        return fromJSON(t, meta) || fromText(t, meta) || fromVision(file, meta);
      });
    }
    if (isText) {
      return readAsText(file).then(function (t) {
        return fromText(t, meta) || fromVision(file, meta);
      });
    }
    if (isPDF) {
      return pdfTextLayer(file).then(function (text) {
        var got = fromText(text, meta);
        // A real text layer with almost nothing legible usually means a
        // scanned (image-only) PDF — fall through to vision.
        return got || fromVision(file, meta);
      });
    }
    if (isImage) {
      return fromVision(file, meta);
    }
    // Unknown type — try text read, then give up honestly (no vision call
    // for a file type we don't understand).
    return readAsText(file).then(function (t) {
      return fromText(t, meta) || Promise.resolve(S.normalize(
        Object.assign(S.EMPTY(), { cc: 'Unsupported file type for auto-read — provider reviews the original in Records.' }),
        Object.assign({ method: 'unreadable' }, meta)
      ));
    }).catch(function () {
      return S.normalize(S.EMPTY(), Object.assign({ method: 'unreadable' }, meta));
    });
  }

  global.BBIntakeMachine = { run: run, fromJSON: fromJSON, fromText: fromText };
})(window);

/* bb-intake-schema.js — THE SPINE.
 * The one intake payload shape every path into the SOAP tool must produce:
 * patient-portal.html (patient fills it themselves), the Intake Machine
 * (Barry uploads a questionnaire some other way), and bb-intakes.js (demo
 * seed data). soap-note-generator-prototype.html and api/draft.mjs already
 * read exactly this shape via ?intake=<base64 JSON> — nothing about the SOAP
 * tool changes; every producer below just has to speak this one dialect.
 *
 * HONESTY RULE (matches HUB_SOURCE_OF_TRUTH.md): a field that can't be read
 * with confidence stays blank/null. Nothing here ever invents a score, a
 * medication, or a diagnosis. Every payload carries WHERE it came from
 * (source/sourceLabel/method) so nothing pretends to be something it isn't.
 */
(function (global) {
  'use strict';

  // Canonical empty shape. Every producer starts from this and fills what it can.
  function EMPTY() {
    return {
      name: '', sex: '', dob: '',
      cc: '',
      scores: { energy: null, libido: null, sleep: null, mood: null },
      meds: '', allergies: '',
      labs: [], flags: [],
      // provenance — never shown as if the patient typed it if it wasn't
      source: 'unknown',        // 'portal' | 'upload' | 'demo'
      sourceLabel: '',          // human string, e.g. "Uploaded by Barry — scan.pdf"
      sourceFile: '',           // original filename, if any
      method: '',               // 'portal' | 'json' | 'pdf-text' | 'text' | 'ai-vision' | 'unreadable'
      submitted: new Date().toISOString().slice(0, 10),
    };
  }

  // The bilingual label dictionary lifted verbatim from patient-portal.html's
  // question set — this is the "knowledge" the local machine already has, so
  // it can recognize a filled-out copy of Barry's own questionnaire without
  // calling any API.
  var LABELS = {
    name:      { vi: 'Họ và tên', en: 'Full Name' },
    dob:       { vi: 'Ngày sinh', en: 'DOB' },
    sex:       { vi: 'Giới tính', en: 'Gender' },
    cc:        { vi: 'Bạn mong muốn đạt được kết quả nào', en: 'what results do you want' },
    meds:      { vi: 'Thuốc / TPCN đang dùng', en: 'Medicines/supplements' },
    allergies: { vi: 'Dị ứng', en: 'Allergies' },
    energy:    { vi: 'Năng lượng', en: 'Energy' },
    sleep:     { vi: 'Giấc ngủ', en: 'Sleep' },
    mood:      { vi: 'Tâm trạng', en: 'Mood' },
    libido:    { vi: 'Ham muốn', en: 'Libido' },
    symptoms:  { vi: 'Dấu hiệu hiện tại', en: 'Symptom Checklist' },
  };

  function clip(s, n) { return String(s == null ? '' : s).slice(0, n); }
  function numOr(v, d) {
    if (v === '' || v == null) return d;
    var n = Number(v);
    return Number.isNaN(n) ? d : Math.max(0, Math.min(10, n));
  }

  // Fill EMPTY() with whatever a producer found; never drops provenance.
  function normalize(partial, meta) {
    var p = partial || {};
    var sc = p.scores || {};
    var out = EMPTY();
    out.name = clip(p.name, 120);
    out.sex = clip(p.sex, 24);
    out.dob = clip(p.dob, 40);
    out.cc = clip(p.cc, 800);
    out.scores = {
      energy: sc.energy == null ? null : numOr(sc.energy, null),
      libido: sc.libido == null ? null : numOr(sc.libido, null),
      sleep:  sc.sleep  == null ? null : numOr(sc.sleep,  null),
      mood:   sc.mood   == null ? null : numOr(sc.mood,   null),
    };
    out.meds = clip(p.meds, 2000);
    out.allergies = clip(p.allergies, 600);
    out.flags = Array.isArray(p.flags) ? p.flags.slice(0, 40).map(function (x) { return clip(x, 240); }) : [];
    out.labs = Array.isArray(p.labs) ? p.labs.slice(0, 80).map(function (x) { return clip(x, 240); }) : [];
    var m = meta || {};
    out.source = m.source || 'unknown';
    out.sourceLabel = clip(m.sourceLabel, 200);
    out.sourceFile = clip(m.sourceFile, 200);
    out.method = m.method || '';
    out.submitted = m.submitted || out.submitted;
    return out;
  }

  function toB64(payload) {
    try { return btoa(unescape(encodeURIComponent(JSON.stringify(payload)))); }
    catch (e) { return ''; }
  }
  function fromB64(str) {
    try { return JSON.parse(decodeURIComponent(escape(atob(str)))); }
    catch (e) { return null; }
  }

  global.BBIntakeSchema = { EMPTY: EMPTY, LABELS: LABELS, normalize: normalize, toB64: toB64, fromB64: fromB64 };
})(window);

/* bb-region.js — Barry Burris, NMD · two-path routing (US vs International)
   ------------------------------------------------------------------------
   Barry practices from Ho Chi Minh City and sees patients both outside and
   inside the U.S. HIPAA only applies to U.S. patients — so the practice runs
   TWO paths:

     • INTERNATIONAL (outside the U.S., incl. Vietnam) — HIPAA does not apply.
       Telehealth + the portal are FULLY LIVE right now.
     • UNITED STATES — HIPAA applies. Video/PHI features stay behind a
       "secure mode" until the HIPAA backend is turned on (see the Go-Live plan).

   A patient's path comes from (in order): a staff override → the patient
   record's `region` → a name guess (Vietnamese names default to International)
   → International (the practice's home base).

   Two toggles:
     • per-patient  — BBRegion.toggleRegion(patient)  (staff routes a patient)
     • practice     — BBRegion.setUsLive(true)         (flip when HIPAA is ready)

   Built by Accelerated Experiences, LLC.
*/
(function () {
  'use strict';
  var US_LIVE_KEY = 'bb_us_live';       // practice toggle: is the U.S. (HIPAA) path live yet?
  var OVER_KEY = 'bb_region_over';      // per-patient overrides { key: 'us' | 'intl' }

  function read(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function clean(n) { return String(n || '').replace(/\s*\(SAMPLE\)\s*/i, '').trim(); }
  function slug(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase(); }

  function keyOf(p) {
    if (p == null) return '';
    if (typeof p === 'object') return p.region_key || slug(clean(p.name));
    return slug(String(p));
  }

  // Vietnamese diacritics or common Vietnamese family names → International.
  var VN_SURNAMES = /^(nguyen|tran|le|pham|hoang|huynh|phan|vu|vo|dang|bui|do|ho|ngo|duong|ly|truong|dinh|cao|mai|luong|lam|trinh|dinh)\b/i;
  function guessRegion(name) {
    var n = clean(name); if (!n) return 'intl';
    if (/[̀-ͯ]/.test(n.normalize('NFD'))) return 'intl';       // has Vietnamese/diacritic marks
    if (VN_SURNAMES.test(slug(n).replace(/-/g, ' '))) return 'intl';
    return 'us';
  }

  var REGIONS = {
    intl: {
      key: 'intl', label: 'International', vlabel: 'Quốc tế', short: 'INTL', flag: '🌏', live: true,
      desc: 'Outside the U.S. — HIPAA does not apply. Telehealth is live now.',
      vdesc: 'Ngoài Hoa Kỳ — HIPAA không áp dụng. Khám từ xa đang hoạt động.'
    },
    us: {
      key: 'us', label: 'United States', vlabel: 'Hoa Kỳ', short: 'U.S.', flag: '🇺🇸', live: false,
      desc: 'U.S. patient — HIPAA applies. Secure video turns on with the HIPAA backend.',
      vdesc: 'Bệnh nhân Hoa Kỳ — HIPAA áp dụng. Video bảo mật bật khi có backend HIPAA.'
    }
  };

  function usLive() { return !!read(US_LIVE_KEY, false); }
  function setUsLive(v) { write(US_LIVE_KEY, !!v); return !!v; }

  function regionOf(p) {
    var over = read(OVER_KEY, {}); var k = keyOf(p);
    if (k && over[k]) return over[k];
    if (p && typeof p === 'object' && p.region) return p.region;
    return guessRegion(p && typeof p === 'object' ? p.name : p);
  }
  function setRegion(p, r) { var over = read(OVER_KEY, {}); over[keyOf(p)] = (r === 'us' ? 'us' : 'intl'); write(OVER_KEY, over); return over[keyOf(p)]; }
  function toggleRegion(p) { return setRegion(p, regionOf(p) === 'us' ? 'intl' : 'us'); }

  // Is live telehealth available for this region right now?
  function telehealthLive(region) { return region === 'intl' ? true : usLive(); }

  function info(region) { return REGIONS[region] || REGIONS.intl; }
  // { flag, label, live } for a region, localized
  function badge(region, lang) {
    var r = info(region);
    return { flag: r.flag, label: (lang === 'vi' ? r.vlabel : r.label), short: r.short, live: (region === 'intl' ? true : usLive()), desc: (lang === 'vi' ? r.vdesc : r.desc) };
  }

  window.BBRegion = {
    REGIONS: REGIONS, US_LIVE_KEY: US_LIVE_KEY,
    usLive: usLive, setUsLive: setUsLive,
    regionOf: regionOf, setRegion: setRegion, toggleRegion: toggleRegion, guessRegion: guessRegion,
    telehealthLive: telehealthLive, info: info, badge: badge, keyOf: keyOf
  };
})();

/* bb-dispensary.js — Barry Burris, NMD · supplement dispensary (the #1 NMD revenue line).
   Provider curates a catalog + recommends a per-patient protocol; the patient sees their
   protocol, browses, and checks out through the payment engine (BBPay → /api/pay → Stripe).

   Embed:  <div id="bb-dispensary"></div>   or  BBDispensary.mount(el,{role,patientKey,patientName,lang})
   Reusable module (same pattern as Check-Ins) so it travels to the white-label hubs.
   Palette: patient = SAGE, staff = clay/RED. Built by Accelerated Experiences, LLC. */
(function () {
  if (window.BBDispensary) return;
  var API = '/api/dispensary';

  // Starter catalog — common professional-grade supplements Barry can enable + price (generic, no brands).
  var STARTER = [
    ['Vitamin D3 + K2', 'Foundations', 'Once daily with a meal'],
    ['Magnesium Glycinate', 'Foundations', '1–2 caps at night'],
    ['Omega-3 (EPA/DHA)', 'Foundations', '1–2 softgels daily'],
    ['Methylated B-Complex', 'Foundations', 'Once daily, AM'],
    ['Probiotic (multi-strain)', 'Gut', '1 cap daily'],
    ['Zinc + Copper', 'Immune', 'Once daily with food'],
    ['Curcumin (bioavailable)', 'Inflammation', '1–2 caps daily'],
    ['Ashwagandha', 'Stress / Adrenal', '1 cap AM or PM'],
    ['NAC', 'Detox / Liver', '1–2 caps daily'],
    ['Berberine', 'Metabolic', 'With meals']
  ];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function money(c) { return '$' + (Math.round(c || 0) / 100).toFixed(2); }
  function api(doName, args) {
    return fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ do: doName }, args)) })
      .then(function (r) { return r.json(); }).catch(function () { return { ok: false, reason: 'net' }; });
  }

  function css(T) {
    if (document.getElementById('bbdisp-css')) return;
    var s = document.createElement('style'); s.id = 'bbdisp-css';
    s.textContent = ([
      '.bbdisp{font-family:Inter,system-ui,-apple-system,sans-serif;color:#2a2118;max-width:760px}',
      '.bbdisp *{box-sizing:border-box}',
      '.bbdisp .tabs{display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap}',
      '.bbdisp .tab{border:1px solid #e0d6bf;background:#fffdf8;color:#6b5c44;border-radius:999px;padding:7px 14px;font-size:13px;cursor:pointer;font-weight:600}',
      '.bbdisp .tab.on{background:__C__;color:#fff;border-color:__C__}',
      '.bbdisp .cartbar{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:10px;background:#fbf7ee;border:1px solid #e6ddca;border-radius:12px;padding:10px 13px;margin-bottom:12px}',
      '.bbdisp .cartbar .t{font-weight:700}.bbdisp .cartbar .sp{flex:1}',
      '.bbdisp button{font:inherit;border:none;border-radius:10px;cursor:pointer;font-weight:600}',
      '.bbdisp .btn{background:linear-gradient(180deg,__C__,__C2__);color:#fff;padding:9px 14px}',
      '.bbdisp .btn.ghost{background:#f2ece0;color:__C__}.bbdisp .btn.sm{padding:6px 10px;font-size:12.5px}',
      '.bbdisp .btn:disabled{opacity:.5;cursor:default}',
      '.bbdisp .prod{display:flex;gap:12px;align-items:flex-start;border:1px solid #ece3d0;border-radius:12px;background:#fffdf8;padding:12px;margin-bottom:9px}',
      '.bbdisp .prod .info{flex:1;min-width:0}',
      '.bbdisp .prod .nm{font-weight:700}.bbdisp .prod .br{font-size:12px;color:#8a7d63}',
      '.bbdisp .prod .ds{font-size:12.5px;color:#6b5c44;margin-top:3px}',
      '.bbdisp .prod .pr{font-family:Fraunces,Georgia,serif;font-weight:700;font-size:16px;white-space:nowrap}',
      '.bbdisp .prod .rx{font-size:12px;color:__C__;font-weight:600;margin-top:4px}',
      '.bbdisp .r{display:flex;align-items:center;gap:8px}',
      '.bbdisp input,.bbdisp textarea,.bbdisp select{border:1px solid #e0d6bf;border-radius:9px;padding:9px 10px;font:inherit;font-size:14px;color:#2a2118;width:100%}',
      '.bbdisp input:focus,.bbdisp textarea:focus{outline:none;border-color:__C__}',
      '.bbdisp .grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}',
      '.bbdisp .form{border:1px solid #e6ddca;border-radius:12px;background:#fffdf8;padding:13px;margin-bottom:14px}',
      '.bbdisp h4{font-family:Fraunces,Georgia,serif;font-size:15px;margin:14px 0 9px;color:#3a2f22}',
      '.bbdisp .empty{color:#8a7d63;font-size:13.5px;padding:16px 4px;text-align:center;line-height:1.5}',
      '.bbdisp .pill{font-size:11px;padding:2px 8px;border-radius:20px;background:#eef2ea;color:#4a6b52;font-weight:600}',
      '.bbdisp .pill.new{background:#fff3d6;color:#8a6a12}.bbdisp .pill.paid{background:#e7f0e0;color:#3f6b2e}',
      '.bbdisp .qty{width:52px;text-align:center;padding:6px}',
      '.bbdisp .muted{color:#8a7d63;font-size:12.5px}',
      '.bbdisp .note{background:#f7f2e7;border-radius:9px;padding:9px 11px;font-size:13px;margin:6px 0 12px;line-height:1.45}'
    ].join('')).replace(/__C2__/g, T.c2).replace(/__C__/g, T.c);
    document.head.appendChild(s);
  }

  function Mount(el, opts) {
    opts = opts || {};
    var me = window.BB_ME || {};
    var role = opts.role || me.role || (/patient/i.test(location.pathname) ? 'patient' : 'provider');
    var T = role === 'patient' ? { c: '#4a6b52', c2: '#3d5a45' } : { c: '#95463f', c2: '#763530' };
    css(T);
    el.classList.add('bbdisp');
    var pk = opts.patientKey || '', pname = opts.patientName || me.name || '';
    var catalog = [];

    function load(cb) { api('products', {}).then(function (r) { catalog = (r && r.products) || []; cb && cb(r); }); }
    function findProd(id) { for (var i = 0; i < catalog.length; i++) if (catalog[i].id === id) return catalog[i]; return null; }

    if (role === 'provider') providerView(); else patientView();

    /* ===================== PROVIDER ===================== */
    function providerView() {
      var tab = 'catalog';
      el.innerHTML = '<div class="tabs"><button class="tab on" data-t="catalog">Catalog</button><button class="tab" data-t="orders">Orders</button></div><div id="bbdisp-body"><div class="empty">Loading…</div></div>';
      var body = el.querySelector('#bbdisp-body');
      [].slice.call(el.querySelectorAll('.tab')).forEach(function (b) { b.addEventListener('click', function () { el.querySelectorAll('.tab').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); tab = b.getAttribute('data-t'); draw(); }); });
      load(draw);
      function draw() { if (tab === 'catalog') drawCatalog(body); else drawOrders(body); }

      function drawCatalog(box) {
        var starter = catalog.length ? '' : '<div class="note">Your dispensary is empty. Add products below, or <b><a href="#" id="bbdisp-seed">load a starter set</a></b> of common supplements to price and enable.</div>';
        box.innerHTML = starter +
          '<div class="form" id="bbdisp-pform"><h4 style="margin-top:0">Add a product</h4>' +
          '<div class="grid"><input id="pf-name" placeholder="Product name"><input id="pf-brand" placeholder="Brand (optional)"></div>' +
          '<div class="grid" style="margin-top:9px"><input id="pf-cat" placeholder="Category (e.g. Gut, Immune)"><input id="pf-price" placeholder="Retail price, e.g. 32.00" inputmode="decimal"></div>' +
          '<textarea id="pf-desc" rows="2" placeholder="Short description (optional)" style="margin-top:9px"></textarea>' +
          '<div style="margin-top:10px"><button class="btn" id="pf-add">Add to dispensary</button></div></div>' +
          '<h4>Catalog (' + catalog.length + ')</h4><div id="bbdisp-clist"></div>';
        var seed = box.querySelector('#bbdisp-seed'); if (seed) seed.addEventListener('click', function (e) { e.preventDefault(); seedStarter(box); });
        box.querySelector('#pf-add').addEventListener('click', function () {
          var name = box.querySelector('#pf-name').value.trim(); if (!name) { box.querySelector('#pf-name').focus(); return; }
          var price = Math.round(parseFloat(box.querySelector('#pf-price').value || '0') * 100);
          api('saveProduct', { name: name, brand: box.querySelector('#pf-brand').value.trim(), cat: box.querySelector('#pf-cat').value.trim(), price: price, desc: box.querySelector('#pf-desc').value.trim() }).then(function (r) { if (r && r.ok) { catalog = r.products; drawCatalog(box); } });
        });
        var list = box.querySelector('#bbdisp-clist');
        if (!catalog.length) { list.innerHTML = '<div class="empty">No products yet.</div>'; return; }
        list.innerHTML = catalog.map(function (p) {
          return '<div class="prod"><div class="info"><div class="nm">' + esc(p.name) + '</div><div class="br">' + esc(p.brand || '') + (p.cat ? ' · ' + esc(p.cat) : '') + '</div>' + (p.desc ? '<div class="ds">' + esc(p.desc) + '</div>' : '') + '</div><div style="text-align:right"><div class="pr">' + money(p.price) + '</div><button class="btn ghost sm" data-del="' + esc(p.id) + '" style="margin-top:6px">Remove</button></div></div>';
        }).join('');
        [].slice.call(list.querySelectorAll('[data-del]')).forEach(function (b) { b.addEventListener('click', function () { api('delProduct', { id: b.getAttribute('data-del') }).then(function (r) { if (r && r.ok) { catalog = r.products; drawCatalog(box); } }); }); });
      }
      function seedStarter(box) {
        var chain = Promise.resolve();
        STARTER.forEach(function (s) { chain = chain.then(function () { return api('saveProduct', { name: s[0], cat: s[1], desc: 'Suggested dose: ' + s[2], price: 0 }); }); });
        chain.then(function () { load(function () { drawCatalog(box); }); });
      }

      function drawOrders(box) {
        box.innerHTML = '<div class="empty">Loading orders…</div>';
        api('orders', {}).then(function (r) {
          if (r && r.reason === 'no_kv') { box.innerHTML = '<div class="empty">Dispensary is finishing setup.</div>'; return; }
          var list = (r && r.orders) || [];
          if (!list.length) { box.innerHTML = '<div class="empty">No orders yet.<br>When a patient orders from their protocol, it lands here.</div>'; return; }
          box.innerHTML = list.map(function (o) {
            var items = o.items.map(function (it) { return esc(it.name) + ' ×' + it.qty; }).join(', ');
            var pillClass = o.paid ? 'paid' : 'new';
            var next = o.status === 'paid' ? 'fulfilling' : o.status === 'fulfilling' ? 'shipped' : o.status === 'shipped' ? 'done' : '';
            return '<div class="prod"><div class="info"><div class="nm">' + esc(o.patientName) + ' <span class="pill ' + pillClass + '">' + esc(o.paid ? o.status : 'unpaid') + '</span></div><div class="ds">' + items + '</div><div class="muted">' + new Date(o.ts).toLocaleString() + '</div></div><div style="text-align:right"><div class="pr">' + money(o.total) + '</div>' + (next ? '<button class="btn ghost sm" data-adv="' + esc(o.id) + '" data-next="' + next + '" style="margin-top:6px">Mark ' + next + '</button>' : '') + '</div></div>';
          }).join('');
          [].slice.call(box.querySelectorAll('[data-adv]')).forEach(function (b) { b.addEventListener('click', function () { api('orderStatus', { id: b.getAttribute('data-adv'), status: b.getAttribute('data-next') }).then(function () { drawOrders(box); }); }); });
        });
      }
    }

    /* ===================== PATIENT ===================== */
    function patientView() {
      var cart = {};   // id -> qty
      var protocol = { items: [], note: '' };
      var tab = 'rx';
      el.innerHTML =
        '<div class="cartbar"><span class="t">Cart</span><span class="muted" id="bbdisp-cartn">empty</span><span class="sp"></span><b id="bbdisp-carttot">$0.00</b><button class="btn sm" id="bbdisp-checkout" disabled>Checkout</button></div>' +
        '<div class="tabs"><button class="tab on" data-t="rx">Recommended</button><button class="tab" data-t="browse">Browse</button><button class="tab" data-t="orders">My orders</button></div>' +
        '<div id="bbdisp-body"><div class="empty">Loading…</div></div>';
      var body = el.querySelector('#bbdisp-body');
      [].slice.call(el.querySelectorAll('.tab')).forEach(function (b) { b.addEventListener('click', function () { el.querySelectorAll('.tab').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); tab = b.getAttribute('data-t'); draw(); }); });
      el.querySelector('#bbdisp-checkout').addEventListener('click', checkout);

      // confirm a returned payment
      if (window.BBPay) window.BBPay.handleReturn(function (r) {
        if (r && r.paid) { var pend = null; try { pend = localStorage.getItem('bb_disp_pending'); } catch (e) {} if (pend) { api('markPaid', { id: pend }); try { localStorage.removeItem('bb_disp_pending'); } catch (e) {} } cart = {}; renderCart(); tab = 'orders'; el.querySelectorAll('.tab').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-t') === 'orders'); }); draw(); }
      });

      load(function () { api('protocolGet', { patientKey: pk }).then(function (r) { protocol = (r && r.protocol) || protocol; draw(); }); });

      function draw() { if (tab === 'rx') drawRx(); else if (tab === 'browse') drawBrowse(); else drawOrders(); }
      function add(id) { cart[id] = (cart[id] || 0) + 1; renderCart(); }
      function renderCart() {
        var n = 0, tot = 0; for (var id in cart) { n += cart[id]; var p = findProd(id); if (p) tot += p.price * cart[id]; }
        el.querySelector('#bbdisp-cartn').textContent = n ? (n + ' item' + (n > 1 ? 's' : '')) : 'empty';
        el.querySelector('#bbdisp-carttot').textContent = money(tot);
        el.querySelector('#bbdisp-checkout').disabled = !n;
      }
      function prodCard(p, rx) {
        var dose = rx ? '<div class="rx">Dr. Burris: ' + esc(rx.dose || '') + (rx.note ? ' — ' + esc(rx.note) : '') + '</div>' : '';
        var priced = p.price > 0;
        return '<div class="prod"><div class="info"><div class="nm">' + esc(p.name) + '</div><div class="br">' + esc(p.brand || '') + (p.cat ? ' · ' + esc(p.cat) : '') + '</div>' + (p.desc ? '<div class="ds">' + esc(p.desc) + '</div>' : '') + dose + '</div><div style="text-align:right"><div class="pr">' + (priced ? money(p.price) : '—') + '</div>' + (priced ? '<button class="btn sm" data-add="' + esc(p.id) + '" style="margin-top:6px">Add</button>' : '<div class="muted" style="margin-top:6px">ask us</div>') + '</div></div>';
      }
      function wireAdd(box) { [].slice.call(box.querySelectorAll('[data-add]')).forEach(function (b) { b.addEventListener('click', function () { add(b.getAttribute('data-add')); }); }); }

      function drawRx() {
        if (!protocol.items || !protocol.items.length) { body.innerHTML = '<div class="empty">No supplement protocol yet.<br>After a visit, Dr. Burris’s recommendations show up here.</div>'; return; }
        var html = protocol.note ? '<div class="note">' + esc(protocol.note) + '</div>' : '';
        html += protocol.items.map(function (it) { var p = findProd(it.productId); return p ? prodCard(p, it) : ''; }).join('');
        body.innerHTML = html; wireAdd(body);
      }
      function drawBrowse() {
        var priced = catalog.filter(function (p) { return p.active !== false; });
        if (!priced.length) { body.innerHTML = '<div class="empty">The dispensary is being set up.</div>'; return; }
        body.innerHTML = priced.map(function (p) { return prodCard(p, null); }).join(''); wireAdd(body);
      }
      function drawOrders() {
        body.innerHTML = '<div class="empty">Loading…</div>';
        api('patientOrders', { patientKey: pk }).then(function (r) {
          var list = (r && r.orders) || [];
          if (!list.length) { body.innerHTML = '<div class="empty">No orders yet.</div>'; return; }
          body.innerHTML = list.map(function (o) {
            var items = o.items.map(function (it) { return esc(it.name) + ' ×' + it.qty; }).join(', ');
            return '<div class="prod"><div class="info"><div class="nm">' + money(o.total) + ' <span class="pill ' + (o.paid ? 'paid' : 'new') + '">' + esc(o.paid ? o.status : 'unpaid') + '</span></div><div class="ds">' + items + '</div><div class="muted">' + new Date(o.ts).toLocaleDateString() + '</div></div></div>';
          }).join('');
        });
      }

      function checkout() {
        var items = []; for (var id in cart) { var p = findProd(id); if (p) items.push({ id: p.id, name: p.name, price: p.price, qty: cart[id] }); }
        if (!items.length) return;
        var btn = el.querySelector('#bbdisp-checkout'); btn.disabled = true; btn.textContent = 'Starting…';
        api('order', { patientKey: pk, patientName: pname, items: items }).then(function (r) {
          if (!r || !r.ok || !r.order) { btn.disabled = false; btn.textContent = 'Checkout'; alert((r && r.message) || 'Could not start the order.'); return; }
          if (!window.BBPay) { btn.disabled = false; btn.textContent = 'Checkout'; alert('Payments aren’t connected yet. Your order is saved — the practice will follow up.'); return; }
          try { localStorage.setItem('bb_disp_pending', r.order.id); } catch (e) {}
          window.BBPay.checkout({ amount: r.order.total, cents: true, description: 'Supplement order — Barry Burris, NMD', patientName: pname, kind: 'dispensary', orderId: r.order.id }).then(function (pr) {
            if (!(pr && pr.ok && pr.url)) { btn.disabled = false; btn.textContent = 'Checkout'; alert(pr && pr.reason === 'no_key' ? 'Payments turn on once the practice connects Stripe. Your order is saved.' : 'Could not open checkout.'); }
          });
        });
      }
    }
  }

  window.BBDispensary = {
    mount: function (el, opts) { if (typeof el === 'string') el = document.querySelector(el); if (el) Mount(el, opts || {}); },
    auto: function () { [].slice.call(document.querySelectorAll('#bb-dispensary,[data-bb-dispensary]')).forEach(function (el) { if (!el.__bbd) { el.__bbd = 1; Mount(el, { role: el.getAttribute('data-role') || undefined, patientKey: el.getAttribute('data-patient-key') || undefined, patientName: el.getAttribute('data-patient-name') || undefined }); } }); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.BBDispensary.auto); else window.BBDispensary.auto();
})();

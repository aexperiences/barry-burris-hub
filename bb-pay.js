/* bb-pay.js — Barry Burris, NMD · client for the payment primitive (/api/pay).
   The one call the whole money layer uses to take a card payment (invoices, dispensary,
   visit fees, packages). Talks to /api/pay (Stripe, env-gated).

     BBPay.checkout({ amount, description, patientName, email, kind, returnPath })
        amount is in DOLLARS (pass { cents:true } to give cents). Redirects to Stripe Checkout.
        Returns a promise resolving to the raw result; on no_key/error it resolves without redirecting.
        Pass { redirect:false } to get { url } back without navigating.

     BBPay.handleReturn(cb)  — call once on page load. If the URL carries ?paid=<session>, it
        verifies with the server, cleans the URL, and calls cb({ ok, paid, orderId, amount }).
        Also fires cb({ paid:false, canceled:true }) if the customer backed out.

   Built by Accelerated Experiences, LLC. */
(function () {
  if (window.BBPay) return;
  var API = '/api/pay';

  function post(doName, args) {
    return fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ do: doName }, args)) })
      .then(function (r) { return r.json(); }).catch(function () { return { ok: false, reason: 'net' }; });
  }

  function checkout(opts) {
    opts = opts || {};
    var cents = Math.round(Number(opts.amount) * (opts.cents ? 1 : 100));
    var args = {
      amount: cents, currency: opts.currency, description: opts.description,
      patientName: opts.patientName, email: opts.email, kind: opts.kind, orderId: opts.orderId,
      returnPath: opts.returnPath || (location.pathname + location.search + location.hash)
    };
    return post('checkout', args).then(function (r) {
      if (r && r.ok && r.url) { if (opts.redirect !== false) { try { location.href = r.url; } catch (e) {} } return r; }
      return r || { ok: false, reason: 'net' };
    });
  }

  function handleReturn(cb) {
    var q; try { q = new URLSearchParams(location.search); } catch (e) { return false; }
    var sid = q.get('paid');
    if (sid) {
      post('verify', { session_id: sid }).then(function (r) { cleanUrl(); if (typeof cb === 'function') cb(r || { ok: false }); });
      return true;
    }
    if (q.get('payx')) { cleanUrl(); if (typeof cb === 'function') cb({ ok: true, paid: false, canceled: true }); return true; }
    return false;
  }

  function cleanUrl() {
    try {
      var u = new URL(location.href); u.searchParams.delete('paid'); u.searchParams.delete('payx');
      var qs = u.searchParams.toString();
      history.replaceState({}, '', u.pathname + (qs ? '?' + qs : '') + u.hash);
    } catch (e) {}
  }

  window.BBPay = { checkout: checkout, handleReturn: handleReturn };
})();

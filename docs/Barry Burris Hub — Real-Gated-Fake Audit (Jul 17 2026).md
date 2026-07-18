# Barry Burris, NMD — Hub Audit: What's Real, What's Gated, What Was Fake
_Jul 17, 2026 · Accelerated Experiences, LLC · run against the AE No-Demos build principle_

---

## Fixed today, as part of this audit

- **Provider Messages inbox was missing entirely** from `barry-burris-hub.html` — Barry had no way to see or answer any patient message. Wired in, deployed, verified live (found and replied to a real waiting message from a patient during testing).
- **Video visits had zero consent step** — clicking any "open room" link fired the camera/mic immediately, including an auto-join on any shared link. Added a "Ready to join?" gate in `bb-rtc.js` that every entry point now funnels through — nothing touches the camera until an explicit click. Verified live.
- **The patient-side "Messages" tab in `patient-account.html` was fake** — wrote to localStorage only, and scripted a canned "Your message reached the care team" auto-reply that never told Barry anything. Replaced with the real thing: it now reads/writes the same `/api/connect` backend the provider inbox uses. Verified end-to-end live (sent a message as a sample patient, watched it land in Barry's real inbox seconds later).

## REAL & LIVE
- SOAP note AI drafting (`api/draft.mjs`)
- Books / AI bookkeeper (`api/books.mjs`, `api/bookkeeper.mjs`)
- Video visits — native WebRTC, P2P, now consent-gated
- Messaging — both sides now real, translated, shared backend
- Check-Ins (async video) — both provider and patient sides wired
- Brian — real AI assistant, real voice input (browser speech recognition)
- Dispensary checkout → real Stripe call
- Records / Contacts — real on-device managers, honestly labeled as such

## REAL BUT HONESTLY GATED (working code, waiting on one named thing)
- **Video TURN server** — no fallback relay if a straight P2P connection can't get through a strict firewall. Needs a TURN vendor (e.g. Twilio, Cloudflare Calls). Hook (`window.BB_TURN`) is already in place.
- **Messaging/Check-ins encryption at rest** — currently demo/non-PHI mode by design, disclosed in the code and on the Check-Ins page. Needs to be BAA-covered or field-encrypted before real patient content goes in. (Same gate as the rest of the HIPAA Go-Live plan — this is a Barry/Anthony decision, not more code.)
- **Stripe payments** — real checkout code, dormant until a Stripe key is connected.
- **Brian's spoken voice replies (ElevenLabs)** — dormant until a key is connected.
- **U.S. HIPAA lane generally** — hosting, telehealth vendor, auth vendor, and BAAs are Barry's four decisions (per the existing HIPAA Go-Live Plan doc). International/Vietnam patients are correctly live today since HIPAA doesn't apply to them.

## Still fake / worth fixing next
- **Billing "+ New invoice", Services "Add to invoice", Growth "+ Add lead", "Preview site", Labs "Order panel"** — buttons with no backend behind them at all (no invoices/CRM API exists yet). Toasts are honest ("this would create an invoice") rather than faking success, but the buttons don't do anything real. Needs either real minimal persistence or an honest "Coming soon" label.
- `barry-calendar.html` has no "on-device only" disclosure banner the way Records/Contacts do — minor honesty gap.

## Missing entirely
- **The word processor.** Confirmed: no editor, no save, no .docx/Google-compatible export, no hook from Brian's real dictation into a document — anywhere in the codebase. This is a from-scratch build.
- No invoices/CRM/leads API backing the Billing/Growth stub buttons above.

---
_Filed per the standing hub-doc-filing convention. Companion doc: `AE BUILD PRINCIPLE — No Demos, Ever.md` at the root of this folder._

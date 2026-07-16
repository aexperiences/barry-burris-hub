/* bb-intakes.js — SAMPLE patient intake roster for the Barry Burris hub.
 * DEMO / SAMPLE DATA ONLY — not real patients. 15 questionnaires that feed the
 * intake -> AI-drafted SOAP -> treatment-plan loop. Each entry carries the exact
 * payload the SOAP tool reads (name, sex, dob, cc, scores, meds, allergies, labs,
 * flags, aiHPI, aiROS, aiConsider) plus a display "submitted" date, a one-word
 * "tag", and a precomputed base64 "b64" for soap-note-generator-prototype.html?intake=.
 * base64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload)))); verified round-trip.
 * HONESTY: AI drafts are history/narrative only — never medications, doses or a diagnosis. */
window.BB_INTAKES = [
 {
  "tag": "Andropause",
  "submitted": "2026-07-15",
  "name": "Marcus Delgado (SAMPLE)",
  "sex": "Male",
  "dob": "1973-08-14",
  "cc": "Fatigue and low energy for ~12 months, with low libido, brain fog, ~15 lb mid-section weight gain and unrefreshing sleep — wants to optimize energy, body composition and longevity.",
  "scores": {
   "energy": 3,
   "libido": 2,
   "sleep": 4,
   "mood": 4
  },
  "meds": "Atorvastatin 10 mg — once daily (since 2024)\nVitamin D3 2000 IU — once daily\nOccasional ibuprofen — as needed",
  "allergies": "NKDA (no known drug allergies)",
  "labs": [
   "LabCorp_Hormone_Panel_2026-06-28.pdf",
   "Quest_CMP_HbA1c_2026-06-28.pdf",
   "Lipid_and_hsCRP_2026-06-28.pdf"
  ],
  "flags": [
   "Testosterone thấp / mãn dục nam (Low testosterone / andropause)",
   "Giấc ngủ / căng thẳng (Sleep / stress)"
  ],
  "aiHPI": "52-year-old male with ~12 months of progressive fatigue and low energy. Reports declining libido, reduced morning erections, brain fog with poorer concentration, and ~15 lb of central weight gain over the same period. Sleep is non-restorative (~5–6 h/night) with occasional early awakening; work stress is moderate-to-high. Onset gradual and persistent, no acute precipitant. Goals: restore energy, improve body composition, support long-term health. Patient self-ratings (0–10): energy 3, libido 2, sleep 4, mood 4. No chest pain, dyspnea, or focal neurologic symptoms reported on intake — provider to confirm on exam.",
  "aiROS": "Constitutional: fatigue, central weight gain. Endocrine/GU: low libido, reduced morning erections. Neuro/Psych: brain fog, low mood, reduced concentration. Sleep: non-restorative sleep. Remainder negative per questionnaire; provider completes exam-based review.",
  "aiConsider": "Patient-reported pattern is consistent with possible hypogonadism/andropause plus a metabolic component; sleep and stress may contribute. Suggested review of the uploaded labs: hormone panel (total & free testosterone, LH/FSH, SHBG, estradiol), metabolic (HbA1c, fasting glucose/insulin), lipids, hs-CRP, thyroid, vitamin D. Consider confirming a low testosterone result with a second early-morning fasted draw before any treatment decision. — AI-drafted considerations from the questionnaire; not a diagnosis and not a treatment recommendation. The provider makes and signs every clinical decision.",
  "b64": "eyJuYW1lIjoiTWFyY3VzIERlbGdhZG8gKFNBTVBMRSkiLCJzZXgiOiJNYWxlIiwiZG9iIjoiMTk3My0wOC0xNCIsImNjIjoiRmF0aWd1ZSBhbmQgbG93IGVuZXJneSBmb3IgfjEyIG1vbnRocywgd2l0aCBsb3cgbGliaWRvLCBicmFpbiBmb2csIH4xNSBsYiBtaWQtc2VjdGlvbiB3ZWlnaHQgZ2FpbiBhbmQgdW5yZWZyZXNoaW5nIHNsZWVwIOKAlCB3YW50cyB0byBvcHRpbWl6ZSBlbmVyZ3ksIGJvZHkgY29tcG9zaXRpb24gYW5kIGxvbmdldml0eS4iLCJzY29yZXMiOnsiZW5lcmd5IjozLCJsaWJpZG8iOjIsInNsZWVwIjo0LCJtb29kIjo0fSwibWVkcyI6IkF0b3J2YXN0YXRpbiAxMCBtZyDigJQgb25jZSBkYWlseSAoc2luY2UgMjAyNClcblZpdGFtaW4gRDMgMjAwMCBJVSDigJQgb25jZSBkYWlseVxuT2NjYXNpb25hbCBpYnVwcm9mZW4g4oCUIGFzIG5lZWRlZCIsImFsbGVyZ2llcyI6Ik5LREEgKG5vIGtub3duIGRydWcgYWxsZXJnaWVzKSIsImxhYnMiOlsiTGFiQ29ycF9Ib3Jtb25lX1BhbmVsXzIwMjYtMDYtMjgucGRmIiwiUXVlc3RfQ01QX0hiQTFjXzIwMjYtMDYtMjgucGRmIiwiTGlwaWRfYW5kX2hzQ1JQXzIwMjYtMDYtMjgucGRmIl0sImZsYWdzIjpbIlRlc3Rvc3Rlcm9uZSB0aOG6pXAgLyBtw6NuIGThu6VjIG5hbSAoTG93IHRlc3Rvc3Rlcm9uZSAvIGFuZHJvcGF1c2UpIiwiR2nhuqVjIG5n4bunIC8gY8SDbmcgdGjhurNuZyAoU2xlZXAgLyBzdHJlc3MpIl0sImFpSFBJIjoiNTIteWVhci1vbGQgbWFsZSB3aXRoIH4xMiBtb250aHMgb2YgcHJvZ3Jlc3NpdmUgZmF0aWd1ZSBhbmQgbG93IGVuZXJneS4gUmVwb3J0cyBkZWNsaW5pbmcgbGliaWRvLCByZWR1Y2VkIG1vcm5pbmcgZXJlY3Rpb25zLCBicmFpbiBmb2cgd2l0aCBwb29yZXIgY29uY2VudHJhdGlvbiwgYW5kIH4xNSBsYiBvZiBjZW50cmFsIHdlaWdodCBnYWluIG92ZXIgdGhlIHNhbWUgcGVyaW9kLiBTbGVlcCBpcyBub24tcmVzdG9yYXRpdmUgKH414oCTNiBoL25pZ2h0KSB3aXRoIG9jY2FzaW9uYWwgZWFybHkgYXdha2VuaW5nOyB3b3JrIHN0cmVzcyBpcyBtb2RlcmF0ZS10by1oaWdoLiBPbnNldCBncmFkdWFsIGFuZCBwZXJzaXN0ZW50LCBubyBhY3V0ZSBwcmVjaXBpdGFudC4gR29hbHM6IHJlc3RvcmUgZW5lcmd5LCBpbXByb3ZlIGJvZHkgY29tcG9zaXRpb24sIHN1cHBvcnQgbG9uZy10ZXJtIGhlYWx0aC4gUGF0aWVudCBzZWxmLXJhdGluZ3MgKDDigJMxMCk6IGVuZXJneSAzLCBsaWJpZG8gMiwgc2xlZXAgNCwgbW9vZCA0LiBObyBjaGVzdCBwYWluLCBkeXNwbmVhLCBvciBmb2NhbCBuZXVyb2xvZ2ljIHN5bXB0b21zIHJlcG9ydGVkIG9uIGludGFrZSDigJQgcHJvdmlkZXIgdG8gY29uZmlybSBvbiBleGFtLiIsImFpUk9TIjoiQ29uc3RpdHV0aW9uYWw6IGZhdGlndWUsIGNlbnRyYWwgd2VpZ2h0IGdhaW4uIEVuZG9jcmluZS9HVTogbG93IGxpYmlkbywgcmVkdWNlZCBtb3JuaW5nIGVyZWN0aW9ucy4gTmV1cm8vUHN5Y2g6IGJyYWluIGZvZywgbG93IG1vb2QsIHJlZHVjZWQgY29uY2VudHJhdGlvbi4gU2xlZXA6IG5vbi1yZXN0b3JhdGl2ZSBzbGVlcC4gUmVtYWluZGVyIG5lZ2F0aXZlIHBlciBxdWVzdGlvbm5haXJlOyBwcm92aWRlciBjb21wbGV0ZXMgZXhhbS1iYXNlZCByZXZpZXcuIiwiYWlDb25zaWRlciI6IlBhdGllbnQtcmVwb3J0ZWQgcGF0dGVybiBpcyBjb25zaXN0ZW50IHdpdGggcG9zc2libGUgaHlwb2dvbmFkaXNtL2FuZHJvcGF1c2UgcGx1cyBhIG1ldGFib2xpYyBjb21wb25lbnQ7IHNsZWVwIGFuZCBzdHJlc3MgbWF5IGNvbnRyaWJ1dGUuIFN1Z2dlc3RlZCByZXZpZXcgb2YgdGhlIHVwbG9hZGVkIGxhYnM6IGhvcm1vbmUgcGFuZWwgKHRvdGFsICYgZnJlZSB0ZXN0b3N0ZXJvbmUsIExIL0ZTSCwgU0hCRywgZXN0cmFkaW9sKSwgbWV0YWJvbGljIChIYkExYywgZmFzdGluZyBnbHVjb3NlL2luc3VsaW4pLCBsaXBpZHMsIGhzLUNSUCwgdGh5cm9pZCwgdml0YW1pbiBELiBDb25zaWRlciBjb25maXJtaW5nIGEgbG93IHRlc3Rvc3Rlcm9uZSByZXN1bHQgd2l0aCBhIHNlY29uZCBlYXJseS1tb3JuaW5nIGZhc3RlZCBkcmF3IGJlZm9yZSBhbnkgdHJlYXRtZW50IGRlY2lzaW9uLiDigJQgQUktZHJhZnRlZCBjb25zaWRlcmF0aW9ucyBmcm9tIHRoZSBxdWVzdGlvbm5haXJlOyBub3QgYSBkaWFnbm9zaXMgYW5kIG5vdCBhIHRyZWF0bWVudCByZWNvbW1lbmRhdGlvbi4gVGhlIHByb3ZpZGVyIG1ha2VzIGFuZCBzaWducyBldmVyeSBjbGluaWNhbCBkZWNpc2lvbi4ifQ=="
 },
 {
  "tag": "Perimenopause",
  "submitted": "2026-07-14",
  "name": "Nguyễn Thị Mai",
  "sex": "Female",
  "dob": "1974-09-30",
  "cc": "Hot flashes, night sweats and increasingly irregular cycles over the past year, with new sleep disruption, mood swings and low energy. Wants to understand her hormones and feel like herself again.",
  "scores": {
   "energy": 4,
   "libido": 3,
   "sleep": 3,
   "mood": 4
  },
  "meds": "Calcium + vitamin D — once daily\nOccasional acetaminophen for headaches",
  "allergies": "NKDA (no known drug allergies)",
  "labs": [
   "Prior_FSH_estradiol_2025-12-10.pdf"
  ],
  "flags": [
   "Menopause / hormone changes",
   "Sleep disruption",
   "Mood changes"
  ],
  "aiHPI": "51-year-old woman reporting ~12 months of vasomotor symptoms (hot flashes, night sweats) with increasingly irregular menstrual cycles. Associated new-onset sleep fragmentation, daytime fatigue, mood lability and reduced libido. Onset gradual, consistent with a perimenopausal transition by patient report; no abnormal bleeding volume noted on intake. Goals: understand hormonal changes and restore sleep, energy and sense of well-being. Patient self-ratings (0–10): energy 4, libido 3, sleep 3, mood 4. Provider to confirm on exam.",
  "aiROS": "Constitutional: fatigue. Endocrine/GYN: hot flashes, night sweats, irregular menses, reduced libido. Sleep: fragmented, non-restorative sleep. Psych: mood swings, irritability. Cardiovascular/respiratory: no chest pain or dyspnea reported. Remainder negative per questionnaire; provider completes exam-based review.",
  "aiConsider": "Reported pattern is consistent with a perimenopausal/menopausal transition; sleep and mood symptoms may be linked to vasomotor disruption. Suggested areas to evaluate: FSH/LH and estradiol in cycle context, thyroid panel (TSH, free T4) to exclude a thyroid contributor, ferritin and CBC if fatigue is prominent, and age-appropriate lipid/metabolic and bone-health screening. Confirm menstrual and bleeding history before any treatment decision. — AI-drafted considerations from the questionnaire; not a diagnosis or treatment recommendation. The provider makes and signs every clinical decision.",
  "b64": "eyJuYW1lIjoiTmd1eeG7hW4gVGjhu4sgTWFpIiwic2V4IjoiRmVtYWxlIiwiZG9iIjoiMTk3NC0wOS0zMCIsImNjIjoiSG90IGZsYXNoZXMsIG5pZ2h0IHN3ZWF0cyBhbmQgaW5jcmVhc2luZ2x5IGlycmVndWxhciBjeWNsZXMgb3ZlciB0aGUgcGFzdCB5ZWFyLCB3aXRoIG5ldyBzbGVlcCBkaXNydXB0aW9uLCBtb29kIHN3aW5ncyBhbmQgbG93IGVuZXJneS4gV2FudHMgdG8gdW5kZXJzdGFuZCBoZXIgaG9ybW9uZXMgYW5kIGZlZWwgbGlrZSBoZXJzZWxmIGFnYWluLiIsInNjb3JlcyI6eyJlbmVyZ3kiOjQsImxpYmlkbyI6Mywic2xlZXAiOjMsIm1vb2QiOjR9LCJtZWRzIjoiQ2FsY2l1bSArIHZpdGFtaW4gRCDigJQgb25jZSBkYWlseVxuT2NjYXNpb25hbCBhY2V0YW1pbm9waGVuIGZvciBoZWFkYWNoZXMiLCJhbGxlcmdpZXMiOiJOS0RBIChubyBrbm93biBkcnVnIGFsbGVyZ2llcykiLCJsYWJzIjpbIlByaW9yX0ZTSF9lc3RyYWRpb2xfMjAyNS0xMi0xMC5wZGYiXSwiZmxhZ3MiOlsiTWVub3BhdXNlIC8gaG9ybW9uZSBjaGFuZ2VzIiwiU2xlZXAgZGlzcnVwdGlvbiIsIk1vb2QgY2hhbmdlcyJdLCJhaUhQSSI6IjUxLXllYXItb2xkIHdvbWFuIHJlcG9ydGluZyB+MTIgbW9udGhzIG9mIHZhc29tb3RvciBzeW1wdG9tcyAoaG90IGZsYXNoZXMsIG5pZ2h0IHN3ZWF0cykgd2l0aCBpbmNyZWFzaW5nbHkgaXJyZWd1bGFyIG1lbnN0cnVhbCBjeWNsZXMuIEFzc29jaWF0ZWQgbmV3LW9uc2V0IHNsZWVwIGZyYWdtZW50YXRpb24sIGRheXRpbWUgZmF0aWd1ZSwgbW9vZCBsYWJpbGl0eSBhbmQgcmVkdWNlZCBsaWJpZG8uIE9uc2V0IGdyYWR1YWwsIGNvbnNpc3RlbnQgd2l0aCBhIHBlcmltZW5vcGF1c2FsIHRyYW5zaXRpb24gYnkgcGF0aWVudCByZXBvcnQ7IG5vIGFibm9ybWFsIGJsZWVkaW5nIHZvbHVtZSBub3RlZCBvbiBpbnRha2UuIEdvYWxzOiB1bmRlcnN0YW5kIGhvcm1vbmFsIGNoYW5nZXMgYW5kIHJlc3RvcmUgc2xlZXAsIGVuZXJneSBhbmQgc2Vuc2Ugb2Ygd2VsbC1iZWluZy4gUGF0aWVudCBzZWxmLXJhdGluZ3MgKDDigJMxMCk6IGVuZXJneSA0LCBsaWJpZG8gMywgc2xlZXAgMywgbW9vZCA0LiBQcm92aWRlciB0byBjb25maXJtIG9uIGV4YW0uIiwiYWlST1MiOiJDb25zdGl0dXRpb25hbDogZmF0aWd1ZS4gRW5kb2NyaW5lL0dZTjogaG90IGZsYXNoZXMsIG5pZ2h0IHN3ZWF0cywgaXJyZWd1bGFyIG1lbnNlcywgcmVkdWNlZCBsaWJpZG8uIFNsZWVwOiBmcmFnbWVudGVkLCBub24tcmVzdG9yYXRpdmUgc2xlZXAuIFBzeWNoOiBtb29kIHN3aW5ncywgaXJyaXRhYmlsaXR5LiBDYXJkaW92YXNjdWxhci9yZXNwaXJhdG9yeTogbm8gY2hlc3QgcGFpbiBvciBkeXNwbmVhIHJlcG9ydGVkLiBSZW1haW5kZXIgbmVnYXRpdmUgcGVyIHF1ZXN0aW9ubmFpcmU7IHByb3ZpZGVyIGNvbXBsZXRlcyBleGFtLWJhc2VkIHJldmlldy4iLCJhaUNvbnNpZGVyIjoiUmVwb3J0ZWQgcGF0dGVybiBpcyBjb25zaXN0ZW50IHdpdGggYSBwZXJpbWVub3BhdXNhbC9tZW5vcGF1c2FsIHRyYW5zaXRpb247IHNsZWVwIGFuZCBtb29kIHN5bXB0b21zIG1heSBiZSBsaW5rZWQgdG8gdmFzb21vdG9yIGRpc3J1cHRpb24uIFN1Z2dlc3RlZCBhcmVhcyB0byBldmFsdWF0ZTogRlNIL0xIIGFuZCBlc3RyYWRpb2wgaW4gY3ljbGUgY29udGV4dCwgdGh5cm9pZCBwYW5lbCAoVFNILCBmcmVlIFQ0KSB0byBleGNsdWRlIGEgdGh5cm9pZCBjb250cmlidXRvciwgZmVycml0aW4gYW5kIENCQyBpZiBmYXRpZ3VlIGlzIHByb21pbmVudCwgYW5kIGFnZS1hcHByb3ByaWF0ZSBsaXBpZC9tZXRhYm9saWMgYW5kIGJvbmUtaGVhbHRoIHNjcmVlbmluZy4gQ29uZmlybSBtZW5zdHJ1YWwgYW5kIGJsZWVkaW5nIGhpc3RvcnkgYmVmb3JlIGFueSB0cmVhdG1lbnQgZGVjaXNpb24uIOKAlCBBSS1kcmFmdGVkIGNvbnNpZGVyYXRpb25zIGZyb20gdGhlIHF1ZXN0aW9ubmFpcmU7IG5vdCBhIGRpYWdub3NpcyBvciB0cmVhdG1lbnQgcmVjb21tZW5kYXRpb24uIFRoZSBwcm92aWRlciBtYWtlcyBhbmQgc2lnbnMgZXZlcnkgY2xpbmljYWwgZGVjaXNpb24uIn0="
 },
 {
  "tag": "Hypothyroid",
  "submitted": "2026-07-13",
  "name": "Trần Thị Hương",
  "sex": "Female",
  "dob": "1982-09-17",
  "cc": "Progressive fatigue, cold intolerance, ~8 lb weight gain, constipation, dry skin and hair thinning over 6–8 months. Family history of thyroid disease; wants her thyroid properly evaluated.",
  "scores": {
   "energy": 3,
   "libido": 4,
   "sleep": 5,
   "mood": 4
  },
  "meds": "Levothyroxine 50 mcg — once daily (started ~3 months ago by a prior clinic)\nVitamin D3 1000 IU — once daily",
  "allergies": "NKDA",
  "labs": [
   "Thyroid_panel_TSH_freeT4_2026-06-20.pdf",
   "TPO_antibody_2026-06-20.pdf"
  ],
  "flags": [
   "Thyroid / metabolism",
   "Fatigue",
   "Weight changes"
  ],
  "aiHPI": "43-year-old woman with 6–8 months of progressive fatigue, cold intolerance, constipation, dry skin, hair thinning and ~8 lb weight gain. Reports a family history of thyroid disease and was recently started on thyroid hormone replacement by an outside clinic, with symptoms only partially improved. Goals: complete evaluation of thyroid function and symptom relief. Patient self-ratings (0–10): energy 3, libido 4, sleep 5, mood 4. Provider to confirm on exam.",
  "aiROS": "Constitutional: fatigue, cold intolerance, weight gain. Integumentary: dry skin, hair thinning. GI: constipation. Neuro/Psych: low mood, mental sluggishness. No palpitations, heat intolerance or neck pain reported. Remainder negative per questionnaire; provider completes exam-based review.",
  "aiConsider": "Reported symptoms and history raise the question of hypothyroidism, and the family history and antibody upload suggest autoimmune thyroiditis is worth evaluating. Suggested review of the uploaded labs: TSH and free T4 (and free T3 if indicated), TPO/thyroglobulin antibodies, plus CBC, ferritin, vitamin D and a metabolic/lipid panel given the fatigue and weight change. Interpret any current replacement against fresh labs and the symptom timeline before an adjustment is considered. — AI-drafted considerations from the questionnaire; not a diagnosis or treatment recommendation. The provider makes and signs every clinical decision.",
  "b64": "eyJuYW1lIjoiVHLhuqduIFRo4buLIEjGsMahbmciLCJzZXgiOiJGZW1hbGUiLCJkb2IiOiIxOTgyLTA5LTE3IiwiY2MiOiJQcm9ncmVzc2l2ZSBmYXRpZ3VlLCBjb2xkIGludG9sZXJhbmNlLCB+OCBsYiB3ZWlnaHQgZ2FpbiwgY29uc3RpcGF0aW9uLCBkcnkgc2tpbiBhbmQgaGFpciB0aGlubmluZyBvdmVyIDbigJM4IG1vbnRocy4gRmFtaWx5IGhpc3Rvcnkgb2YgdGh5cm9pZCBkaXNlYXNlOyB3YW50cyBoZXIgdGh5cm9pZCBwcm9wZXJseSBldmFsdWF0ZWQuIiwic2NvcmVzIjp7ImVuZXJneSI6MywibGliaWRvIjo0LCJzbGVlcCI6NSwibW9vZCI6NH0sIm1lZHMiOiJMZXZvdGh5cm94aW5lIDUwIG1jZyDigJQgb25jZSBkYWlseSAoc3RhcnRlZCB+MyBtb250aHMgYWdvIGJ5IGEgcHJpb3IgY2xpbmljKVxuVml0YW1pbiBEMyAxMDAwIElVIOKAlCBvbmNlIGRhaWx5IiwiYWxsZXJnaWVzIjoiTktEQSIsImxhYnMiOlsiVGh5cm9pZF9wYW5lbF9UU0hfZnJlZVQ0XzIwMjYtMDYtMjAucGRmIiwiVFBPX2FudGlib2R5XzIwMjYtMDYtMjAucGRmIl0sImZsYWdzIjpbIlRoeXJvaWQgLyBtZXRhYm9saXNtIiwiRmF0aWd1ZSIsIldlaWdodCBjaGFuZ2VzIl0sImFpSFBJIjoiNDMteWVhci1vbGQgd29tYW4gd2l0aCA24oCTOCBtb250aHMgb2YgcHJvZ3Jlc3NpdmUgZmF0aWd1ZSwgY29sZCBpbnRvbGVyYW5jZSwgY29uc3RpcGF0aW9uLCBkcnkgc2tpbiwgaGFpciB0aGlubmluZyBhbmQgfjggbGIgd2VpZ2h0IGdhaW4uIFJlcG9ydHMgYSBmYW1pbHkgaGlzdG9yeSBvZiB0aHlyb2lkIGRpc2Vhc2UgYW5kIHdhcyByZWNlbnRseSBzdGFydGVkIG9uIHRoeXJvaWQgaG9ybW9uZSByZXBsYWNlbWVudCBieSBhbiBvdXRzaWRlIGNsaW5pYywgd2l0aCBzeW1wdG9tcyBvbmx5IHBhcnRpYWxseSBpbXByb3ZlZC4gR29hbHM6IGNvbXBsZXRlIGV2YWx1YXRpb24gb2YgdGh5cm9pZCBmdW5jdGlvbiBhbmQgc3ltcHRvbSByZWxpZWYuIFBhdGllbnQgc2VsZi1yYXRpbmdzICgw4oCTMTApOiBlbmVyZ3kgMywgbGliaWRvIDQsIHNsZWVwIDUsIG1vb2QgNC4gUHJvdmlkZXIgdG8gY29uZmlybSBvbiBleGFtLiIsImFpUk9TIjoiQ29uc3RpdHV0aW9uYWw6IGZhdGlndWUsIGNvbGQgaW50b2xlcmFuY2UsIHdlaWdodCBnYWluLiBJbnRlZ3VtZW50YXJ5OiBkcnkgc2tpbiwgaGFpciB0aGlubmluZy4gR0k6IGNvbnN0aXBhdGlvbi4gTmV1cm8vUHN5Y2g6IGxvdyBtb29kLCBtZW50YWwgc2x1Z2dpc2huZXNzLiBObyBwYWxwaXRhdGlvbnMsIGhlYXQgaW50b2xlcmFuY2Ugb3IgbmVjayBwYWluIHJlcG9ydGVkLiBSZW1haW5kZXIgbmVnYXRpdmUgcGVyIHF1ZXN0aW9ubmFpcmU7IHByb3ZpZGVyIGNvbXBsZXRlcyBleGFtLWJhc2VkIHJldmlldy4iLCJhaUNvbnNpZGVyIjoiUmVwb3J0ZWQgc3ltcHRvbXMgYW5kIGhpc3RvcnkgcmFpc2UgdGhlIHF1ZXN0aW9uIG9mIGh5cG90aHlyb2lkaXNtLCBhbmQgdGhlIGZhbWlseSBoaXN0b3J5IGFuZCBhbnRpYm9keSB1cGxvYWQgc3VnZ2VzdCBhdXRvaW1tdW5lIHRoeXJvaWRpdGlzIGlzIHdvcnRoIGV2YWx1YXRpbmcuIFN1Z2dlc3RlZCByZXZpZXcgb2YgdGhlIHVwbG9hZGVkIGxhYnM6IFRTSCBhbmQgZnJlZSBUNCAoYW5kIGZyZWUgVDMgaWYgaW5kaWNhdGVkKSwgVFBPL3RoeXJvZ2xvYnVsaW4gYW50aWJvZGllcywgcGx1cyBDQkMsIGZlcnJpdGluLCB2aXRhbWluIEQgYW5kIGEgbWV0YWJvbGljL2xpcGlkIHBhbmVsIGdpdmVuIHRoZSBmYXRpZ3VlIGFuZCB3ZWlnaHQgY2hhbmdlLiBJbnRlcnByZXQgYW55IGN1cnJlbnQgcmVwbGFjZW1lbnQgYWdhaW5zdCBmcmVzaCBsYWJzIGFuZCB0aGUgc3ltcHRvbSB0aW1lbGluZSBiZWZvcmUgYW4gYWRqdXN0bWVudCBpcyBjb25zaWRlcmVkLiDigJQgQUktZHJhZnRlZCBjb25zaWRlcmF0aW9ucyBmcm9tIHRoZSBxdWVzdGlvbm5haXJlOyBub3QgYSBkaWFnbm9zaXMgb3IgdHJlYXRtZW50IHJlY29tbWVuZGF0aW9uLiBUaGUgcHJvdmlkZXIgbWFrZXMgYW5kIHNpZ25zIGV2ZXJ5IGNsaW5pY2FsIGRlY2lzaW9uLiJ9"
 },
 {
  "tag": "Prediabetes",
  "submitted": "2026-07-13",
  "name": "David Whitfield",
  "sex": "Male",
  "dob": "1979-04-30",
  "cc": "Gradual weight gain (~25 lb over 3 years) centered at the waist, afternoon energy crashes, and a recent \"borderline blood sugar\" result from a corporate screening. Wants to lose fat and avoid diabetes.",
  "scores": {
   "energy": 4,
   "libido": 5,
   "sleep": 5,
   "mood": 5
  },
  "meds": "None",
  "allergies": "Penicillin (rash as a child)",
  "labs": [
   "Corporate_screening_HbA1c_glucose_2026-06-15.pdf",
   "Lipid_panel_2026-06-15.pdf"
  ],
  "flags": [
   "Weight / body composition",
   "Blood sugar / metabolic",
   "Energy crashes"
  ],
  "aiHPI": "47-year-old man reporting ~25 lb of predominantly central weight gain over three years, post-prandial and mid-afternoon energy crashes, and a recent screening result he describes as \"borderline\" for blood sugar. Reports a sedentary desk-based routine with rising work travel. No polyuria, polydipsia or visual change reported on intake. Goals: reduce visceral fat and lower diabetes risk. Patient self-ratings (0–10): energy 4, libido 5, sleep 5, mood 5. Provider to confirm on exam.",
  "aiROS": "Constitutional: central weight gain, post-prandial fatigue. Endocrine: reported borderline glucose; no polyuria/polydipsia. Cardiovascular: no chest pain or exertional symptoms reported. Remainder negative per questionnaire; provider completes exam-based review.",
  "aiConsider": "Reported pattern is consistent with a metabolic / insulin-resistance picture worth characterizing. Suggested review of the uploaded screening plus: fasting glucose and HbA1c (consider fasting insulin/HOMA-IR), a full lipid panel with ApoB if available, liver enzymes, and waist/BMI/blood-pressure measures; thyroid if fatigue is prominent. Confirm fasting status and repeat any borderline glucose before any treatment decision. — AI-drafted considerations from the questionnaire; not a diagnosis or treatment recommendation. The provider makes and signs every clinical decision.",
  "b64": "eyJuYW1lIjoiRGF2aWQgV2hpdGZpZWxkIiwic2V4IjoiTWFsZSIsImRvYiI6IjE5NzktMDQtMzAiLCJjYyI6IkdyYWR1YWwgd2VpZ2h0IGdhaW4gKH4yNSBsYiBvdmVyIDMgeWVhcnMpIGNlbnRlcmVkIGF0IHRoZSB3YWlzdCwgYWZ0ZXJub29uIGVuZXJneSBjcmFzaGVzLCBhbmQgYSByZWNlbnQgXCJib3JkZXJsaW5lIGJsb29kIHN1Z2FyXCIgcmVzdWx0IGZyb20gYSBjb3Jwb3JhdGUgc2NyZWVuaW5nLiBXYW50cyB0byBsb3NlIGZhdCBhbmQgYXZvaWQgZGlhYmV0ZXMuIiwic2NvcmVzIjp7ImVuZXJneSI6NCwibGliaWRvIjo1LCJzbGVlcCI6NSwibW9vZCI6NX0sIm1lZHMiOiJOb25lIiwiYWxsZXJnaWVzIjoiUGVuaWNpbGxpbiAocmFzaCBhcyBhIGNoaWxkKSIsImxhYnMiOlsiQ29ycG9yYXRlX3NjcmVlbmluZ19IYkExY19nbHVjb3NlXzIwMjYtMDYtMTUucGRmIiwiTGlwaWRfcGFuZWxfMjAyNi0wNi0xNS5wZGYiXSwiZmxhZ3MiOlsiV2VpZ2h0IC8gYm9keSBjb21wb3NpdGlvbiIsIkJsb29kIHN1Z2FyIC8gbWV0YWJvbGljIiwiRW5lcmd5IGNyYXNoZXMiXSwiYWlIUEkiOiI0Ny15ZWFyLW9sZCBtYW4gcmVwb3J0aW5nIH4yNSBsYiBvZiBwcmVkb21pbmFudGx5IGNlbnRyYWwgd2VpZ2h0IGdhaW4gb3ZlciB0aHJlZSB5ZWFycywgcG9zdC1wcmFuZGlhbCBhbmQgbWlkLWFmdGVybm9vbiBlbmVyZ3kgY3Jhc2hlcywgYW5kIGEgcmVjZW50IHNjcmVlbmluZyByZXN1bHQgaGUgZGVzY3JpYmVzIGFzIFwiYm9yZGVybGluZVwiIGZvciBibG9vZCBzdWdhci4gUmVwb3J0cyBhIHNlZGVudGFyeSBkZXNrLWJhc2VkIHJvdXRpbmUgd2l0aCByaXNpbmcgd29yayB0cmF2ZWwuIE5vIHBvbHl1cmlhLCBwb2x5ZGlwc2lhIG9yIHZpc3VhbCBjaGFuZ2UgcmVwb3J0ZWQgb24gaW50YWtlLiBHb2FsczogcmVkdWNlIHZpc2NlcmFsIGZhdCBhbmQgbG93ZXIgZGlhYmV0ZXMgcmlzay4gUGF0aWVudCBzZWxmLXJhdGluZ3MgKDDigJMxMCk6IGVuZXJneSA0LCBsaWJpZG8gNSwgc2xlZXAgNSwgbW9vZCA1LiBQcm92aWRlciB0byBjb25maXJtIG9uIGV4YW0uIiwiYWlST1MiOiJDb25zdGl0dXRpb25hbDogY2VudHJhbCB3ZWlnaHQgZ2FpbiwgcG9zdC1wcmFuZGlhbCBmYXRpZ3VlLiBFbmRvY3JpbmU6IHJlcG9ydGVkIGJvcmRlcmxpbmUgZ2x1Y29zZTsgbm8gcG9seXVyaWEvcG9seWRpcHNpYS4gQ2FyZGlvdmFzY3VsYXI6IG5vIGNoZXN0IHBhaW4gb3IgZXhlcnRpb25hbCBzeW1wdG9tcyByZXBvcnRlZC4gUmVtYWluZGVyIG5lZ2F0aXZlIHBlciBxdWVzdGlvbm5haXJlOyBwcm92aWRlciBjb21wbGV0ZXMgZXhhbS1iYXNlZCByZXZpZXcuIiwiYWlDb25zaWRlciI6IlJlcG9ydGVkIHBhdHRlcm4gaXMgY29uc2lzdGVudCB3aXRoIGEgbWV0YWJvbGljIC8gaW5zdWxpbi1yZXNpc3RhbmNlIHBpY3R1cmUgd29ydGggY2hhcmFjdGVyaXppbmcuIFN1Z2dlc3RlZCByZXZpZXcgb2YgdGhlIHVwbG9hZGVkIHNjcmVlbmluZyBwbHVzOiBmYXN0aW5nIGdsdWNvc2UgYW5kIEhiQTFjIChjb25zaWRlciBmYXN0aW5nIGluc3VsaW4vSE9NQS1JUiksIGEgZnVsbCBsaXBpZCBwYW5lbCB3aXRoIEFwb0IgaWYgYXZhaWxhYmxlLCBsaXZlciBlbnp5bWVzLCBhbmQgd2Fpc3QvQk1JL2Jsb29kLXByZXNzdXJlIG1lYXN1cmVzOyB0aHlyb2lkIGlmIGZhdGlndWUgaXMgcHJvbWluZW50LiBDb25maXJtIGZhc3Rpbmcgc3RhdHVzIGFuZCByZXBlYXQgYW55IGJvcmRlcmxpbmUgZ2x1Y29zZSBiZWZvcmUgYW55IHRyZWF0bWVudCBkZWNpc2lvbi4g4oCUIEFJLWRyYWZ0ZWQgY29uc2lkZXJhdGlvbnMgZnJvbSB0aGUgcXVlc3Rpb25uYWlyZTsgbm90IGEgZGlhZ25vc2lzIG9yIHRyZWF0bWVudCByZWNvbW1lbmRhdGlvbi4gVGhlIHByb3ZpZGVyIG1ha2VzIGFuZCBzaWducyBldmVyeSBjbGluaWNhbCBkZWNpc2lvbi4ifQ=="
 },
 {
  "tag": "Fatigue",
  "submitted": "2026-07-12",
  "name": "Emily Foster",
  "sex": "Female",
  "dob": "1989-12-03",
  "cc": "Persistent, unexplained exhaustion for ~5 months that is not relieved by rest, with post-exertional tiredness and difficulty getting through the workday. Several prior \"normal\" workups; wants answers.",
  "scores": {
   "energy": 2,
   "libido": 4,
   "sleep": 4,
   "mood": 4
  },
  "meds": "Oral contraceptive pill — daily\nIron supplement — intermittently",
  "allergies": "NKDA",
  "labs": [
   "Prior_CBC_ferritin_2026-04-02.pdf"
  ],
  "flags": [
   "Chronic fatigue",
   "Post-exertional tiredness",
   "Unrefreshing sleep"
  ],
  "aiHPI": "36-year-old woman with ~5 months of persistent fatigue not relieved by rest, with post-exertional worsening and reduced daytime function. Reports several prior evaluations described as normal. Sleep is unrefreshing; no fever, weight loss or night sweats reported on intake. Goals: identify a contributing cause and regain daytime energy. Patient self-ratings (0–10): energy 2, libido 4, sleep 4, mood 4. Provider to confirm on exam.",
  "aiROS": "Constitutional: marked fatigue, post-exertional malaise. Sleep: non-restorative. HEENT/Resp: no sore throat, cough or fever reported. Heme: prior iron supplementation. Psych: low mood secondary to fatigue reported. Remainder negative per questionnaire; provider completes exam-based review.",
  "aiConsider": "Fatigue this persistent warrants a broad, structured screen before narrowing. Suggested areas to evaluate: CBC and iron studies/ferritin, thyroid panel, metabolic panel and fasting glucose, vitamin D and B12, inflammatory markers (ESR/CRP), and a careful sleep and mood history; consider infectious or autoimmune screening if the history directs. Review prior labs for trends before repeating, and confirm findings clinically before any treatment decision. — AI-drafted considerations from the questionnaire; not a diagnosis or treatment recommendation. The provider makes and signs every clinical decision.",
  "b64": "eyJuYW1lIjoiRW1pbHkgRm9zdGVyIiwic2V4IjoiRmVtYWxlIiwiZG9iIjoiMTk4OS0xMi0wMyIsImNjIjoiUGVyc2lzdGVudCwgdW5leHBsYWluZWQgZXhoYXVzdGlvbiBmb3IgfjUgbW9udGhzIHRoYXQgaXMgbm90IHJlbGlldmVkIGJ5IHJlc3QsIHdpdGggcG9zdC1leGVydGlvbmFsIHRpcmVkbmVzcyBhbmQgZGlmZmljdWx0eSBnZXR0aW5nIHRocm91Z2ggdGhlIHdvcmtkYXkuIFNldmVyYWwgcHJpb3IgXCJub3JtYWxcIiB3b3JrdXBzOyB3YW50cyBhbnN3ZXJzLiIsInNjb3JlcyI6eyJlbmVyZ3kiOjIsImxpYmlkbyI6NCwic2xlZXAiOjQsIm1vb2QiOjR9LCJtZWRzIjoiT3JhbCBjb250cmFjZXB0aXZlIHBpbGwg4oCUIGRhaWx5XG5Jcm9uIHN1cHBsZW1lbnQg4oCUIGludGVybWl0dGVudGx5IiwiYWxsZXJnaWVzIjoiTktEQSIsImxhYnMiOlsiUHJpb3JfQ0JDX2ZlcnJpdGluXzIwMjYtMDQtMDIucGRmIl0sImZsYWdzIjpbIkNocm9uaWMgZmF0aWd1ZSIsIlBvc3QtZXhlcnRpb25hbCB0aXJlZG5lc3MiLCJVbnJlZnJlc2hpbmcgc2xlZXAiXSwiYWlIUEkiOiIzNi15ZWFyLW9sZCB3b21hbiB3aXRoIH41IG1vbnRocyBvZiBwZXJzaXN0ZW50IGZhdGlndWUgbm90IHJlbGlldmVkIGJ5IHJlc3QsIHdpdGggcG9zdC1leGVydGlvbmFsIHdvcnNlbmluZyBhbmQgcmVkdWNlZCBkYXl0aW1lIGZ1bmN0aW9uLiBSZXBvcnRzIHNldmVyYWwgcHJpb3IgZXZhbHVhdGlvbnMgZGVzY3JpYmVkIGFzIG5vcm1hbC4gU2xlZXAgaXMgdW5yZWZyZXNoaW5nOyBubyBmZXZlciwgd2VpZ2h0IGxvc3Mgb3IgbmlnaHQgc3dlYXRzIHJlcG9ydGVkIG9uIGludGFrZS4gR29hbHM6IGlkZW50aWZ5IGEgY29udHJpYnV0aW5nIGNhdXNlIGFuZCByZWdhaW4gZGF5dGltZSBlbmVyZ3kuIFBhdGllbnQgc2VsZi1yYXRpbmdzICgw4oCTMTApOiBlbmVyZ3kgMiwgbGliaWRvIDQsIHNsZWVwIDQsIG1vb2QgNC4gUHJvdmlkZXIgdG8gY29uZmlybSBvbiBleGFtLiIsImFpUk9TIjoiQ29uc3RpdHV0aW9uYWw6IG1hcmtlZCBmYXRpZ3VlLCBwb3N0LWV4ZXJ0aW9uYWwgbWFsYWlzZS4gU2xlZXA6IG5vbi1yZXN0b3JhdGl2ZS4gSEVFTlQvUmVzcDogbm8gc29yZSB0aHJvYXQsIGNvdWdoIG9yIGZldmVyIHJlcG9ydGVkLiBIZW1lOiBwcmlvciBpcm9uIHN1cHBsZW1lbnRhdGlvbi4gUHN5Y2g6IGxvdyBtb29kIHNlY29uZGFyeSB0byBmYXRpZ3VlIHJlcG9ydGVkLiBSZW1haW5kZXIgbmVnYXRpdmUgcGVyIHF1ZXN0aW9ubmFpcmU7IHByb3ZpZGVyIGNvbXBsZXRlcyBleGFtLWJhc2VkIHJldmlldy4iLCJhaUNvbnNpZGVyIjoiRmF0aWd1ZSB0aGlzIHBlcnNpc3RlbnQgd2FycmFudHMgYSBicm9hZCwgc3RydWN0dXJlZCBzY3JlZW4gYmVmb3JlIG5hcnJvd2luZy4gU3VnZ2VzdGVkIGFyZWFzIHRvIGV2YWx1YXRlOiBDQkMgYW5kIGlyb24gc3R1ZGllcy9mZXJyaXRpbiwgdGh5cm9pZCBwYW5lbCwgbWV0YWJvbGljIHBhbmVsIGFuZCBmYXN0aW5nIGdsdWNvc2UsIHZpdGFtaW4gRCBhbmQgQjEyLCBpbmZsYW1tYXRvcnkgbWFya2VycyAoRVNSL0NSUCksIGFuZCBhIGNhcmVmdWwgc2xlZXAgYW5kIG1vb2QgaGlzdG9yeTsgY29uc2lkZXIgaW5mZWN0aW91cyBvciBhdXRvaW1tdW5lIHNjcmVlbmluZyBpZiB0aGUgaGlzdG9yeSBkaXJlY3RzLiBSZXZpZXcgcHJpb3IgbGFicyBmb3IgdHJlbmRzIGJlZm9yZSByZXBlYXRpbmcsIGFuZCBjb25maXJtIGZpbmRpbmdzIGNsaW5pY2FsbHkgYmVmb3JlIGFueSB0cmVhdG1lbnQgZGVjaXNpb24uIOKAlCBBSS1kcmFmdGVkIGNvbnNpZGVyYXRpb25zIGZyb20gdGhlIHF1ZXN0aW9ubmFpcmU7IG5vdCBhIGRpYWdub3NpcyBvciB0cmVhdG1lbnQgcmVjb21tZW5kYXRpb24uIFRoZSBwcm92aWRlciBtYWtlcyBhbmQgc2lnbnMgZXZlcnkgY2xpbmljYWwgZGVjaXNpb24uIn0="
 },
 {
  "tag": "Insomnia",
  "submitted": "2026-07-11",
  "name": "Lê Minh Tuấn",
  "sex": "Male",
  "dob": "1985-07-28",
  "cc": "Trouble falling and staying asleep for ~4 months tied to a high-pressure work period, averaging 4–5 hours a night, with daytime fatigue, irritability and heavy caffeine reliance. Wants to sleep without medication.",
  "scores": {
   "energy": 4,
   "libido": 5,
   "sleep": 2,
   "mood": 4
  },
  "meds": "Melatonin 3 mg — most nights\nOccasional over-the-counter sleep aid",
  "allergies": "NKDA",
  "labs": [],
  "flags": [
   "Insomnia / sleep",
   "Work stress",
   "Daytime fatigue"
  ],
  "aiHPI": "40-year-old man with ~4 months of sleep-onset and sleep-maintenance difficulty coinciding with a high-pressure work period, averaging 4–5 hours nightly. Associated daytime fatigue, irritability and heavy caffeine use; uses melatonin and occasional OTC sleep aids with limited benefit. No snoring or witnessed apnea reported on intake. Goals: restore sleep without long-term medication. Patient self-ratings (0–10): energy 4, libido 5, sleep 2, mood 4. Provider to confirm on exam.",
  "aiROS": "Sleep: prolonged sleep latency, frequent awakenings, short total sleep time. Constitutional: daytime fatigue. Psych: stress, irritability, night-time rumination. Cardio/Resp: no palpitations; no reported snoring or apnea. Remainder negative per questionnaire; provider completes exam-based review.",
  "aiConsider": "Reported pattern is consistent with stress-related insomnia; contributors such as caffeine load, evening screen use and an underlying mood/anxiety component are worth evaluating. Suggested areas to review: a sleep history and sleep-hygiene inventory, screening for obstructive sleep apnea risk, thyroid panel and ferritin (restless sleep), and morning/evening stress and mood screening — labs mainly to exclude medical contributors. Confirm clinically before any treatment decision. — AI-drafted considerations from the questionnaire; not a diagnosis or treatment recommendation. The provider makes and signs every clinical decision.",
  "b64": "eyJuYW1lIjoiTMOqIE1pbmggVHXhuqVuIiwic2V4IjoiTWFsZSIsImRvYiI6IjE5ODUtMDctMjgiLCJjYyI6IlRyb3VibGUgZmFsbGluZyBhbmQgc3RheWluZyBhc2xlZXAgZm9yIH40IG1vbnRocyB0aWVkIHRvIGEgaGlnaC1wcmVzc3VyZSB3b3JrIHBlcmlvZCwgYXZlcmFnaW5nIDTigJM1IGhvdXJzIGEgbmlnaHQsIHdpdGggZGF5dGltZSBmYXRpZ3VlLCBpcnJpdGFiaWxpdHkgYW5kIGhlYXZ5IGNhZmZlaW5lIHJlbGlhbmNlLiBXYW50cyB0byBzbGVlcCB3aXRob3V0IG1lZGljYXRpb24uIiwic2NvcmVzIjp7ImVuZXJneSI6NCwibGliaWRvIjo1LCJzbGVlcCI6MiwibW9vZCI6NH0sIm1lZHMiOiJNZWxhdG9uaW4gMyBtZyDigJQgbW9zdCBuaWdodHNcbk9jY2FzaW9uYWwgb3Zlci10aGUtY291bnRlciBzbGVlcCBhaWQiLCJhbGxlcmdpZXMiOiJOS0RBIiwibGFicyI6W10sImZsYWdzIjpbIkluc29tbmlhIC8gc2xlZXAiLCJXb3JrIHN0cmVzcyIsIkRheXRpbWUgZmF0aWd1ZSJdLCJhaUhQSSI6IjQwLXllYXItb2xkIG1hbiB3aXRoIH40IG1vbnRocyBvZiBzbGVlcC1vbnNldCBhbmQgc2xlZXAtbWFpbnRlbmFuY2UgZGlmZmljdWx0eSBjb2luY2lkaW5nIHdpdGggYSBoaWdoLXByZXNzdXJlIHdvcmsgcGVyaW9kLCBhdmVyYWdpbmcgNOKAkzUgaG91cnMgbmlnaHRseS4gQXNzb2NpYXRlZCBkYXl0aW1lIGZhdGlndWUsIGlycml0YWJpbGl0eSBhbmQgaGVhdnkgY2FmZmVpbmUgdXNlOyB1c2VzIG1lbGF0b25pbiBhbmQgb2NjYXNpb25hbCBPVEMgc2xlZXAgYWlkcyB3aXRoIGxpbWl0ZWQgYmVuZWZpdC4gTm8gc25vcmluZyBvciB3aXRuZXNzZWQgYXBuZWEgcmVwb3J0ZWQgb24gaW50YWtlLiBHb2FsczogcmVzdG9yZSBzbGVlcCB3aXRob3V0IGxvbmctdGVybSBtZWRpY2F0aW9uLiBQYXRpZW50IHNlbGYtcmF0aW5ncyAoMOKAkzEwKTogZW5lcmd5IDQsIGxpYmlkbyA1LCBzbGVlcCAyLCBtb29kIDQuIFByb3ZpZGVyIHRvIGNvbmZpcm0gb24gZXhhbS4iLCJhaVJPUyI6IlNsZWVwOiBwcm9sb25nZWQgc2xlZXAgbGF0ZW5jeSwgZnJlcXVlbnQgYXdha2VuaW5ncywgc2hvcnQgdG90YWwgc2xlZXAgdGltZS4gQ29uc3RpdHV0aW9uYWw6IGRheXRpbWUgZmF0aWd1ZS4gUHN5Y2g6IHN0cmVzcywgaXJyaXRhYmlsaXR5LCBuaWdodC10aW1lIHJ1bWluYXRpb24uIENhcmRpby9SZXNwOiBubyBwYWxwaXRhdGlvbnM7IG5vIHJlcG9ydGVkIHNub3Jpbmcgb3IgYXBuZWEuIFJlbWFpbmRlciBuZWdhdGl2ZSBwZXIgcXVlc3Rpb25uYWlyZTsgcHJvdmlkZXIgY29tcGxldGVzIGV4YW0tYmFzZWQgcmV2aWV3LiIsImFpQ29uc2lkZXIiOiJSZXBvcnRlZCBwYXR0ZXJuIGlzIGNvbnNpc3RlbnQgd2l0aCBzdHJlc3MtcmVsYXRlZCBpbnNvbW5pYTsgY29udHJpYnV0b3JzIHN1Y2ggYXMgY2FmZmVpbmUgbG9hZCwgZXZlbmluZyBzY3JlZW4gdXNlIGFuZCBhbiB1bmRlcmx5aW5nIG1vb2QvYW54aWV0eSBjb21wb25lbnQgYXJlIHdvcnRoIGV2YWx1YXRpbmcuIFN1Z2dlc3RlZCBhcmVhcyB0byByZXZpZXc6IGEgc2xlZXAgaGlzdG9yeSBhbmQgc2xlZXAtaHlnaWVuZSBpbnZlbnRvcnksIHNjcmVlbmluZyBmb3Igb2JzdHJ1Y3RpdmUgc2xlZXAgYXBuZWEgcmlzaywgdGh5cm9pZCBwYW5lbCBhbmQgZmVycml0aW4gKHJlc3RsZXNzIHNsZWVwKSwgYW5kIG1vcm5pbmcvZXZlbmluZyBzdHJlc3MgYW5kIG1vb2Qgc2NyZWVuaW5nIOKAlCBsYWJzIG1haW5seSB0byBleGNsdWRlIG1lZGljYWwgY29udHJpYnV0b3JzLiBDb25maXJtIGNsaW5pY2FsbHkgYmVmb3JlIGFueSB0cmVhdG1lbnQgZGVjaXNpb24uIOKAlCBBSS1kcmFmdGVkIGNvbnNpZGVyYXRpb25zIGZyb20gdGhlIHF1ZXN0aW9ubmFpcmU7IG5vdCBhIGRpYWdub3NpcyBvciB0cmVhdG1lbnQgcmVjb21tZW5kYXRpb24uIFRoZSBwcm92aWRlciBtYWtlcyBhbmQgc2lnbnMgZXZlcnkgY2xpbmljYWwgZGVjaXNpb24uIn0="
 },
 {
  "tag": "Low-libido",
  "submitted": "2026-07-11",
  "name": "Sarah Chen",
  "sex": "Female",
  "dob": "1978-02-14",
  "cc": "A noticeable decline in sex drive and arousal over the past ~1.5 years, with some vaginal dryness and lower relationship satisfaction. Cycles still regular. Wants to understand why and explore options.",
  "scores": {
   "energy": 5,
   "libido": 2,
   "sleep": 5,
   "mood": 5
  },
  "meds": "None",
  "allergies": "Sulfa drugs (hives)",
  "labs": [
   "Hormone_panel_2026-05-28.pdf"
  ],
  "flags": [
   "Low libido",
   "Hormone changes",
   "Vaginal dryness"
  ],
  "aiHPI": "48-year-old woman reporting ~18 months of declining libido and arousal with associated vaginal dryness and reduced relationship satisfaction. Menstrual cycles reported as still regular. No abnormal bleeding or mood disorder reported on intake; not on hormonal medication. Goals: understand contributing factors and discuss options. Patient self-ratings (0–10): energy 5, libido 2, sleep 5, mood 5. Provider to confirm on exam.",
  "aiROS": "Endocrine/GYN: low libido, reduced arousal, vaginal dryness, regular menses. Constitutional: energy relatively preserved. Psych: mood reported stable; relationship stress noted. No hot flashes or night sweats reported. Remainder negative per questionnaire; provider completes exam-based review.",
  "aiConsider": "Reported low libido in this age range can be multifactorial — hormonal, relational, sleep, mood and medication factors all merit consideration. Suggested review of the uploaded hormone panel plus, as indicated: total/free testosterone, SHBG, estradiol, FSH/LH, prolactin and thyroid; screen for mood, stress and relationship contributors and review any medications. Confirm history and exam before any treatment decision. — AI-drafted considerations from the questionnaire; not a diagnosis or treatment recommendation. The provider makes and signs every clinical decision.",
  "b64": "eyJuYW1lIjoiU2FyYWggQ2hlbiIsInNleCI6IkZlbWFsZSIsImRvYiI6IjE5NzgtMDItMTQiLCJjYyI6IkEgbm90aWNlYWJsZSBkZWNsaW5lIGluIHNleCBkcml2ZSBhbmQgYXJvdXNhbCBvdmVyIHRoZSBwYXN0IH4xLjUgeWVhcnMsIHdpdGggc29tZSB2YWdpbmFsIGRyeW5lc3MgYW5kIGxvd2VyIHJlbGF0aW9uc2hpcCBzYXRpc2ZhY3Rpb24uIEN5Y2xlcyBzdGlsbCByZWd1bGFyLiBXYW50cyB0byB1bmRlcnN0YW5kIHdoeSBhbmQgZXhwbG9yZSBvcHRpb25zLiIsInNjb3JlcyI6eyJlbmVyZ3kiOjUsImxpYmlkbyI6Miwic2xlZXAiOjUsIm1vb2QiOjV9LCJtZWRzIjoiTm9uZSIsImFsbGVyZ2llcyI6IlN1bGZhIGRydWdzIChoaXZlcykiLCJsYWJzIjpbIkhvcm1vbmVfcGFuZWxfMjAyNi0wNS0yOC5wZGYiXSwiZmxhZ3MiOlsiTG93IGxpYmlkbyIsIkhvcm1vbmUgY2hhbmdlcyIsIlZhZ2luYWwgZHJ5bmVzcyJdLCJhaUhQSSI6IjQ4LXllYXItb2xkIHdvbWFuIHJlcG9ydGluZyB+MTggbW9udGhzIG9mIGRlY2xpbmluZyBsaWJpZG8gYW5kIGFyb3VzYWwgd2l0aCBhc3NvY2lhdGVkIHZhZ2luYWwgZHJ5bmVzcyBhbmQgcmVkdWNlZCByZWxhdGlvbnNoaXAgc2F0aXNmYWN0aW9uLiBNZW5zdHJ1YWwgY3ljbGVzIHJlcG9ydGVkIGFzIHN0aWxsIHJlZ3VsYXIuIE5vIGFibm9ybWFsIGJsZWVkaW5nIG9yIG1vb2QgZGlzb3JkZXIgcmVwb3J0ZWQgb24gaW50YWtlOyBub3Qgb24gaG9ybW9uYWwgbWVkaWNhdGlvbi4gR29hbHM6IHVuZGVyc3RhbmQgY29udHJpYnV0aW5nIGZhY3RvcnMgYW5kIGRpc2N1c3Mgb3B0aW9ucy4gUGF0aWVudCBzZWxmLXJhdGluZ3MgKDDigJMxMCk6IGVuZXJneSA1LCBsaWJpZG8gMiwgc2xlZXAgNSwgbW9vZCA1LiBQcm92aWRlciB0byBjb25maXJtIG9uIGV4YW0uIiwiYWlST1MiOiJFbmRvY3JpbmUvR1lOOiBsb3cgbGliaWRvLCByZWR1Y2VkIGFyb3VzYWwsIHZhZ2luYWwgZHJ5bmVzcywgcmVndWxhciBtZW5zZXMuIENvbnN0aXR1dGlvbmFsOiBlbmVyZ3kgcmVsYXRpdmVseSBwcmVzZXJ2ZWQuIFBzeWNoOiBtb29kIHJlcG9ydGVkIHN0YWJsZTsgcmVsYXRpb25zaGlwIHN0cmVzcyBub3RlZC4gTm8gaG90IGZsYXNoZXMgb3IgbmlnaHQgc3dlYXRzIHJlcG9ydGVkLiBSZW1haW5kZXIgbmVnYXRpdmUgcGVyIHF1ZXN0aW9ubmFpcmU7IHByb3ZpZGVyIGNvbXBsZXRlcyBleGFtLWJhc2VkIHJldmlldy4iLCJhaUNvbnNpZGVyIjoiUmVwb3J0ZWQgbG93IGxpYmlkbyBpbiB0aGlzIGFnZSByYW5nZSBjYW4gYmUgbXVsdGlmYWN0b3JpYWwg4oCUIGhvcm1vbmFsLCByZWxhdGlvbmFsLCBzbGVlcCwgbW9vZCBhbmQgbWVkaWNhdGlvbiBmYWN0b3JzIGFsbCBtZXJpdCBjb25zaWRlcmF0aW9uLiBTdWdnZXN0ZWQgcmV2aWV3IG9mIHRoZSB1cGxvYWRlZCBob3Jtb25lIHBhbmVsIHBsdXMsIGFzIGluZGljYXRlZDogdG90YWwvZnJlZSB0ZXN0b3N0ZXJvbmUsIFNIQkcsIGVzdHJhZGlvbCwgRlNIL0xILCBwcm9sYWN0aW4gYW5kIHRoeXJvaWQ7IHNjcmVlbiBmb3IgbW9vZCwgc3RyZXNzIGFuZCByZWxhdGlvbnNoaXAgY29udHJpYnV0b3JzIGFuZCByZXZpZXcgYW55IG1lZGljYXRpb25zLiBDb25maXJtIGhpc3RvcnkgYW5kIGV4YW0gYmVmb3JlIGFueSB0cmVhdG1lbnQgZGVjaXNpb24uIOKAlCBBSS1kcmFmdGVkIGNvbnNpZGVyYXRpb25zIGZyb20gdGhlIHF1ZXN0aW9ubmFpcmU7IG5vdCBhIGRpYWdub3NpcyBvciB0cmVhdG1lbnQgcmVjb21tZW5kYXRpb24uIFRoZSBwcm92aWRlciBtYWtlcyBhbmQgc2lnbnMgZXZlcnkgY2xpbmljYWwgZGVjaXNpb24uIn0="
 },
 {
  "tag": "PCOS",
  "submitted": "2026-07-10",
  "name": "Phạm Thị Ngọc",
  "sex": "Female",
  "dob": "1996-05-19",
  "cc": "Irregular, often skipped periods since her early twenties, along with acne, unwanted facial hair and difficulty losing weight. Planning to conceive within the next year and wants evaluation.",
  "scores": {
   "energy": 5,
   "libido": 5,
   "sleep": 6,
   "mood": 4
  },
  "meds": "None currently (previously on oral contraceptives)",
  "allergies": "NKDA",
  "labs": [
   "Pelvic_ultrasound_report_2026-06-10.pdf",
   "Prior_hormones_2025-10.pdf"
  ],
  "flags": [
   "Irregular cycles",
   "Acne / hair growth",
   "Fertility planning"
  ],
  "aiHPI": "30-year-old woman with long-standing oligomenorrhea since her early twenties, associated acne, hirsutism and difficulty losing weight. Previously used oral contraceptives, now discontinued while planning conception within the next year. No galactorrhea or rapid virilization reported on intake. Goals: evaluation of irregular cycles and pre-conception planning. Patient self-ratings (0–10): energy 5, libido 5, sleep 6, mood 4. Provider to confirm on exam.",
  "aiROS": "Endocrine/GYN: irregular/skipped menses, acne, hirsutism. Metabolic: difficulty losing weight. Psych: mild mood frustration reported. No heat/cold intolerance or galactorrhea reported. Remainder negative per questionnaire; provider completes exam-based review.",
  "aiConsider": "Reported pattern raises the question of a PCOS-spectrum presentation, which benefits from structured hormonal and metabolic evaluation. Suggested review of the uploaded ultrasound plus, as indicated: total/free testosterone, DHEA-S, LH/FSH, SHBG, prolactin, TSH, 17-OH-progesterone, and a metabolic screen (fasting glucose/insulin, HbA1c, lipids) given the weight history; coordinate pre-conception counseling. Confirm diagnostic criteria clinically before any treatment decision. — AI-drafted considerations from the questionnaire; not a diagnosis or treatment recommendation. The provider makes and signs every clinical decision.",
  "b64": "eyJuYW1lIjoiUGjhuqFtIFRo4buLIE5n4buNYyIsInNleCI6IkZlbWFsZSIsImRvYiI6IjE5OTYtMDUtMTkiLCJjYyI6IklycmVndWxhciwgb2Z0ZW4gc2tpcHBlZCBwZXJpb2RzIHNpbmNlIGhlciBlYXJseSB0d2VudGllcywgYWxvbmcgd2l0aCBhY25lLCB1bndhbnRlZCBmYWNpYWwgaGFpciBhbmQgZGlmZmljdWx0eSBsb3Npbmcgd2VpZ2h0LiBQbGFubmluZyB0byBjb25jZWl2ZSB3aXRoaW4gdGhlIG5leHQgeWVhciBhbmQgd2FudHMgZXZhbHVhdGlvbi4iLCJzY29yZXMiOnsiZW5lcmd5Ijo1LCJsaWJpZG8iOjUsInNsZWVwIjo2LCJtb29kIjo0fSwibWVkcyI6Ik5vbmUgY3VycmVudGx5IChwcmV2aW91c2x5IG9uIG9yYWwgY29udHJhY2VwdGl2ZXMpIiwiYWxsZXJnaWVzIjoiTktEQSIsImxhYnMiOlsiUGVsdmljX3VsdHJhc291bmRfcmVwb3J0XzIwMjYtMDYtMTAucGRmIiwiUHJpb3JfaG9ybW9uZXNfMjAyNS0xMC5wZGYiXSwiZmxhZ3MiOlsiSXJyZWd1bGFyIGN5Y2xlcyIsIkFjbmUgLyBoYWlyIGdyb3d0aCIsIkZlcnRpbGl0eSBwbGFubmluZyJdLCJhaUhQSSI6IjMwLXllYXItb2xkIHdvbWFuIHdpdGggbG9uZy1zdGFuZGluZyBvbGlnb21lbm9ycmhlYSBzaW5jZSBoZXIgZWFybHkgdHdlbnRpZXMsIGFzc29jaWF0ZWQgYWNuZSwgaGlyc3V0aXNtIGFuZCBkaWZmaWN1bHR5IGxvc2luZyB3ZWlnaHQuIFByZXZpb3VzbHkgdXNlZCBvcmFsIGNvbnRyYWNlcHRpdmVzLCBub3cgZGlzY29udGludWVkIHdoaWxlIHBsYW5uaW5nIGNvbmNlcHRpb24gd2l0aGluIHRoZSBuZXh0IHllYXIuIE5vIGdhbGFjdG9ycmhlYSBvciByYXBpZCB2aXJpbGl6YXRpb24gcmVwb3J0ZWQgb24gaW50YWtlLiBHb2FsczogZXZhbHVhdGlvbiBvZiBpcnJlZ3VsYXIgY3ljbGVzIGFuZCBwcmUtY29uY2VwdGlvbiBwbGFubmluZy4gUGF0aWVudCBzZWxmLXJhdGluZ3MgKDDigJMxMCk6IGVuZXJneSA1LCBsaWJpZG8gNSwgc2xlZXAgNiwgbW9vZCA0LiBQcm92aWRlciB0byBjb25maXJtIG9uIGV4YW0uIiwiYWlST1MiOiJFbmRvY3JpbmUvR1lOOiBpcnJlZ3VsYXIvc2tpcHBlZCBtZW5zZXMsIGFjbmUsIGhpcnN1dGlzbS4gTWV0YWJvbGljOiBkaWZmaWN1bHR5IGxvc2luZyB3ZWlnaHQuIFBzeWNoOiBtaWxkIG1vb2QgZnJ1c3RyYXRpb24gcmVwb3J0ZWQuIE5vIGhlYXQvY29sZCBpbnRvbGVyYW5jZSBvciBnYWxhY3RvcnJoZWEgcmVwb3J0ZWQuIFJlbWFpbmRlciBuZWdhdGl2ZSBwZXIgcXVlc3Rpb25uYWlyZTsgcHJvdmlkZXIgY29tcGxldGVzIGV4YW0tYmFzZWQgcmV2aWV3LiIsImFpQ29uc2lkZXIiOiJSZXBvcnRlZCBwYXR0ZXJuIHJhaXNlcyB0aGUgcXVlc3Rpb24gb2YgYSBQQ09TLXNwZWN0cnVtIHByZXNlbnRhdGlvbiwgd2hpY2ggYmVuZWZpdHMgZnJvbSBzdHJ1Y3R1cmVkIGhvcm1vbmFsIGFuZCBtZXRhYm9saWMgZXZhbHVhdGlvbi4gU3VnZ2VzdGVkIHJldmlldyBvZiB0aGUgdXBsb2FkZWQgdWx0cmFzb3VuZCBwbHVzLCBhcyBpbmRpY2F0ZWQ6IHRvdGFsL2ZyZWUgdGVzdG9zdGVyb25lLCBESEVBLVMsIExIL0ZTSCwgU0hCRywgcHJvbGFjdGluLCBUU0gsIDE3LU9ILXByb2dlc3Rlcm9uZSwgYW5kIGEgbWV0YWJvbGljIHNjcmVlbiAoZmFzdGluZyBnbHVjb3NlL2luc3VsaW4sIEhiQTFjLCBsaXBpZHMpIGdpdmVuIHRoZSB3ZWlnaHQgaGlzdG9yeTsgY29vcmRpbmF0ZSBwcmUtY29uY2VwdGlvbiBjb3Vuc2VsaW5nLiBDb25maXJtIGRpYWdub3N0aWMgY3JpdGVyaWEgY2xpbmljYWxseSBiZWZvcmUgYW55IHRyZWF0bWVudCBkZWNpc2lvbi4g4oCUIEFJLWRyYWZ0ZWQgY29uc2lkZXJhdGlvbnMgZnJvbSB0aGUgcXVlc3Rpb25uYWlyZTsgbm90IGEgZGlhZ25vc2lzIG9yIHRyZWF0bWVudCByZWNvbW1lbmRhdGlvbi4gVGhlIHByb3ZpZGVyIG1ha2VzIGFuZCBzaWducyBldmVyeSBjbGluaWNhbCBkZWNpc2lvbi4ifQ=="
 },
 {
  "tag": "Cardio-risk",
  "submitted": "2026-07-09",
  "name": "Robert Nguyen",
  "sex": "Male",
  "dob": "1959-10-08",
  "cc": "High cholesterol flagged at his last physical and a father who had a heart attack at 60. Feels well but wants a serious look at his heart-disease risk and whether he needs to act.",
  "scores": {
   "energy": 6,
   "libido": 5,
   "sleep": 6,
   "mood": 6
  },
  "meds": "Lisinopril 10 mg — once daily (blood pressure)\nAspirin 81 mg — occasionally",
  "allergies": "NKDA",
  "labs": [
   "Lipid_panel_2026-06-22.pdf",
   "ApoB_Lpa_2026-06-22.pdf",
   "BMP_2026-06-22.pdf"
  ],
  "flags": [
   "High cholesterol",
   "Family heart history",
   "Blood pressure"
  ],
  "aiHPI": "66-year-old man, generally well, presenting for cardiovascular risk evaluation after elevated cholesterol was flagged at his last physical. Reports a paternal history of myocardial infarction at age 60 and treated hypertension. Denies chest pain, exertional dyspnea or claudication on intake. Goals: understand his heart-disease risk and whether intervention is warranted. Patient self-ratings (0–10): energy 6, libido 5, sleep 6, mood 6. Provider to confirm on exam.",
  "aiROS": "Cardiovascular: no chest pain, dyspnea, palpitations or claudication reported; treated hypertension. Constitutional: feels well. Endocrine: no polyuria/polydipsia. Remainder negative per questionnaire; provider completes exam-based review.",
  "aiConsider": "With a family history of premature coronary disease and treated hypertension, a thorough lipid and global-risk assessment is reasonable. Suggested review of the uploaded labs: full lipid panel with ApoB and Lp(a), fasting glucose/HbA1c, hs-CRP, renal panel and a blood-pressure trend; consider a formal risk-score and coronary-calcium discussion per current guidelines. Confirm findings and risk calculation before any treatment decision. — AI-drafted considerations from the questionnaire; not a diagnosis or treatment recommendation. The provider makes and signs every clinical decision.",
  "b64": "eyJuYW1lIjoiUm9iZXJ0IE5ndXllbiIsInNleCI6Ik1hbGUiLCJkb2IiOiIxOTU5LTEwLTA4IiwiY2MiOiJIaWdoIGNob2xlc3Rlcm9sIGZsYWdnZWQgYXQgaGlzIGxhc3QgcGh5c2ljYWwgYW5kIGEgZmF0aGVyIHdobyBoYWQgYSBoZWFydCBhdHRhY2sgYXQgNjAuIEZlZWxzIHdlbGwgYnV0IHdhbnRzIGEgc2VyaW91cyBsb29rIGF0IGhpcyBoZWFydC1kaXNlYXNlIHJpc2sgYW5kIHdoZXRoZXIgaGUgbmVlZHMgdG8gYWN0LiIsInNjb3JlcyI6eyJlbmVyZ3kiOjYsImxpYmlkbyI6NSwic2xlZXAiOjYsIm1vb2QiOjZ9LCJtZWRzIjoiTGlzaW5vcHJpbCAxMCBtZyDigJQgb25jZSBkYWlseSAoYmxvb2QgcHJlc3N1cmUpXG5Bc3BpcmluIDgxIG1nIOKAlCBvY2Nhc2lvbmFsbHkiLCJhbGxlcmdpZXMiOiJOS0RBIiwibGFicyI6WyJMaXBpZF9wYW5lbF8yMDI2LTA2LTIyLnBkZiIsIkFwb0JfTHBhXzIwMjYtMDYtMjIucGRmIiwiQk1QXzIwMjYtMDYtMjIucGRmIl0sImZsYWdzIjpbIkhpZ2ggY2hvbGVzdGVyb2wiLCJGYW1pbHkgaGVhcnQgaGlzdG9yeSIsIkJsb29kIHByZXNzdXJlIl0sImFpSFBJIjoiNjYteWVhci1vbGQgbWFuLCBnZW5lcmFsbHkgd2VsbCwgcHJlc2VudGluZyBmb3IgY2FyZGlvdmFzY3VsYXIgcmlzayBldmFsdWF0aW9uIGFmdGVyIGVsZXZhdGVkIGNob2xlc3Rlcm9sIHdhcyBmbGFnZ2VkIGF0IGhpcyBsYXN0IHBoeXNpY2FsLiBSZXBvcnRzIGEgcGF0ZXJuYWwgaGlzdG9yeSBvZiBteW9jYXJkaWFsIGluZmFyY3Rpb24gYXQgYWdlIDYwIGFuZCB0cmVhdGVkIGh5cGVydGVuc2lvbi4gRGVuaWVzIGNoZXN0IHBhaW4sIGV4ZXJ0aW9uYWwgZHlzcG5lYSBvciBjbGF1ZGljYXRpb24gb24gaW50YWtlLiBHb2FsczogdW5kZXJzdGFuZCBoaXMgaGVhcnQtZGlzZWFzZSByaXNrIGFuZCB3aGV0aGVyIGludGVydmVudGlvbiBpcyB3YXJyYW50ZWQuIFBhdGllbnQgc2VsZi1yYXRpbmdzICgw4oCTMTApOiBlbmVyZ3kgNiwgbGliaWRvIDUsIHNsZWVwIDYsIG1vb2QgNi4gUHJvdmlkZXIgdG8gY29uZmlybSBvbiBleGFtLiIsImFpUk9TIjoiQ2FyZGlvdmFzY3VsYXI6IG5vIGNoZXN0IHBhaW4sIGR5c3BuZWEsIHBhbHBpdGF0aW9ucyBvciBjbGF1ZGljYXRpb24gcmVwb3J0ZWQ7IHRyZWF0ZWQgaHlwZXJ0ZW5zaW9uLiBDb25zdGl0dXRpb25hbDogZmVlbHMgd2VsbC4gRW5kb2NyaW5lOiBubyBwb2x5dXJpYS9wb2x5ZGlwc2lhLiBSZW1haW5kZXIgbmVnYXRpdmUgcGVyIHF1ZXN0aW9ubmFpcmU7IHByb3ZpZGVyIGNvbXBsZXRlcyBleGFtLWJhc2VkIHJldmlldy4iLCJhaUNvbnNpZGVyIjoiV2l0aCBhIGZhbWlseSBoaXN0b3J5IG9mIHByZW1hdHVyZSBjb3JvbmFyeSBkaXNlYXNlIGFuZCB0cmVhdGVkIGh5cGVydGVuc2lvbiwgYSB0aG9yb3VnaCBsaXBpZCBhbmQgZ2xvYmFsLXJpc2sgYXNzZXNzbWVudCBpcyByZWFzb25hYmxlLiBTdWdnZXN0ZWQgcmV2aWV3IG9mIHRoZSB1cGxvYWRlZCBsYWJzOiBmdWxsIGxpcGlkIHBhbmVsIHdpdGggQXBvQiBhbmQgTHAoYSksIGZhc3RpbmcgZ2x1Y29zZS9IYkExYywgaHMtQ1JQLCByZW5hbCBwYW5lbCBhbmQgYSBibG9vZC1wcmVzc3VyZSB0cmVuZDsgY29uc2lkZXIgYSBmb3JtYWwgcmlzay1zY29yZSBhbmQgY29yb25hcnktY2FsY2l1bSBkaXNjdXNzaW9uIHBlciBjdXJyZW50IGd1aWRlbGluZXMuIENvbmZpcm0gZmluZGluZ3MgYW5kIHJpc2sgY2FsY3VsYXRpb24gYmVmb3JlIGFueSB0cmVhdG1lbnQgZGVjaXNpb24uIOKAlCBBSS1kcmFmdGVkIGNvbnNpZGVyYXRpb25zIGZyb20gdGhlIHF1ZXN0aW9ubmFpcmU7IG5vdCBhIGRpYWdub3NpcyBvciB0cmVhdG1lbnQgcmVjb21tZW5kYXRpb24uIFRoZSBwcm92aWRlciBtYWtlcyBhbmQgc2lnbnMgZXZlcnkgY2xpbmljYWwgZGVjaXNpb24uIn0="
 },
 {
  "tag": "Recovery",
  "submitted": "2026-07-09",
  "name": "Jake Morrison",
  "sex": "Male",
  "dob": "1991-03-11",
  "cc": "A recreational athlete finding recovery between hard training sessions slower than it used to be, with lingering muscle soreness and a nagging shoulder. Interested in evidence-based ways to support recovery and performance.",
  "scores": {
   "energy": 6,
   "libido": 6,
   "sleep": 5,
   "mood": 6
  },
  "meds": "Whey protein and creatine — daily\nOmega-3 fish oil — daily",
  "allergies": "NKDA",
  "labs": [
   "Baseline_metabolic_hormone_2026-06-30.pdf"
  ],
  "flags": [
   "Athletic recovery",
   "Muscle soreness",
   "Performance optimization"
  ],
  "aiHPI": "35-year-old recreationally competitive male athlete reporting slower recovery between high-intensity sessions over recent months, persistent delayed-onset muscle soreness and a nagging shoulder complaint. Sleep is somewhat short during heavy training blocks. No acute injury, weight loss or systemic symptoms reported on intake. Goals: evidence-based support for recovery and performance. Patient self-ratings (0–10): energy 6, libido 6, sleep 5, mood 6. Provider to confirm on exam.",
  "aiROS": "Musculoskeletal: delayed muscle soreness, chronic shoulder discomfort. Constitutional: training-related fatigue. Sleep: shortened during heavy blocks. No fever or unintended weight change reported. Remainder negative per questionnaire; provider completes exam-based review.",
  "aiConsider": "For an athlete optimizing recovery, it is reasonable to establish a healthy baseline and exclude limiters before discussing options. Suggested areas to evaluate: CBC, ferritin/iron studies, metabolic panel, vitamin D, thyroid, and a hormone baseline; assess training load, sleep and nutrition, and consider focused musculoskeletal evaluation of the shoulder. Any performance-support discussion follows clinical assessment. Confirm before any treatment decision. — AI-drafted considerations from the questionnaire; not a diagnosis or treatment recommendation. The provider makes and signs every clinical decision.",
  "b64": "eyJuYW1lIjoiSmFrZSBNb3JyaXNvbiIsInNleCI6Ik1hbGUiLCJkb2IiOiIxOTkxLTAzLTExIiwiY2MiOiJBIHJlY3JlYXRpb25hbCBhdGhsZXRlIGZpbmRpbmcgcmVjb3ZlcnkgYmV0d2VlbiBoYXJkIHRyYWluaW5nIHNlc3Npb25zIHNsb3dlciB0aGFuIGl0IHVzZWQgdG8gYmUsIHdpdGggbGluZ2VyaW5nIG11c2NsZSBzb3JlbmVzcyBhbmQgYSBuYWdnaW5nIHNob3VsZGVyLiBJbnRlcmVzdGVkIGluIGV2aWRlbmNlLWJhc2VkIHdheXMgdG8gc3VwcG9ydCByZWNvdmVyeSBhbmQgcGVyZm9ybWFuY2UuIiwic2NvcmVzIjp7ImVuZXJneSI6NiwibGliaWRvIjo2LCJzbGVlcCI6NSwibW9vZCI6Nn0sIm1lZHMiOiJXaGV5IHByb3RlaW4gYW5kIGNyZWF0aW5lIOKAlCBkYWlseVxuT21lZ2EtMyBmaXNoIG9pbCDigJQgZGFpbHkiLCJhbGxlcmdpZXMiOiJOS0RBIiwibGFicyI6WyJCYXNlbGluZV9tZXRhYm9saWNfaG9ybW9uZV8yMDI2LTA2LTMwLnBkZiJdLCJmbGFncyI6WyJBdGhsZXRpYyByZWNvdmVyeSIsIk11c2NsZSBzb3JlbmVzcyIsIlBlcmZvcm1hbmNlIG9wdGltaXphdGlvbiJdLCJhaUhQSSI6IjM1LXllYXItb2xkIHJlY3JlYXRpb25hbGx5IGNvbXBldGl0aXZlIG1hbGUgYXRobGV0ZSByZXBvcnRpbmcgc2xvd2VyIHJlY292ZXJ5IGJldHdlZW4gaGlnaC1pbnRlbnNpdHkgc2Vzc2lvbnMgb3ZlciByZWNlbnQgbW9udGhzLCBwZXJzaXN0ZW50IGRlbGF5ZWQtb25zZXQgbXVzY2xlIHNvcmVuZXNzIGFuZCBhIG5hZ2dpbmcgc2hvdWxkZXIgY29tcGxhaW50LiBTbGVlcCBpcyBzb21ld2hhdCBzaG9ydCBkdXJpbmcgaGVhdnkgdHJhaW5pbmcgYmxvY2tzLiBObyBhY3V0ZSBpbmp1cnksIHdlaWdodCBsb3NzIG9yIHN5c3RlbWljIHN5bXB0b21zIHJlcG9ydGVkIG9uIGludGFrZS4gR29hbHM6IGV2aWRlbmNlLWJhc2VkIHN1cHBvcnQgZm9yIHJlY292ZXJ5IGFuZCBwZXJmb3JtYW5jZS4gUGF0aWVudCBzZWxmLXJhdGluZ3MgKDDigJMxMCk6IGVuZXJneSA2LCBsaWJpZG8gNiwgc2xlZXAgNSwgbW9vZCA2LiBQcm92aWRlciB0byBjb25maXJtIG9uIGV4YW0uIiwiYWlST1MiOiJNdXNjdWxvc2tlbGV0YWw6IGRlbGF5ZWQgbXVzY2xlIHNvcmVuZXNzLCBjaHJvbmljIHNob3VsZGVyIGRpc2NvbWZvcnQuIENvbnN0aXR1dGlvbmFsOiB0cmFpbmluZy1yZWxhdGVkIGZhdGlndWUuIFNsZWVwOiBzaG9ydGVuZWQgZHVyaW5nIGhlYXZ5IGJsb2Nrcy4gTm8gZmV2ZXIgb3IgdW5pbnRlbmRlZCB3ZWlnaHQgY2hhbmdlIHJlcG9ydGVkLiBSZW1haW5kZXIgbmVnYXRpdmUgcGVyIHF1ZXN0aW9ubmFpcmU7IHByb3ZpZGVyIGNvbXBsZXRlcyBleGFtLWJhc2VkIHJldmlldy4iLCJhaUNvbnNpZGVyIjoiRm9yIGFuIGF0aGxldGUgb3B0aW1pemluZyByZWNvdmVyeSwgaXQgaXMgcmVhc29uYWJsZSB0byBlc3RhYmxpc2ggYSBoZWFsdGh5IGJhc2VsaW5lIGFuZCBleGNsdWRlIGxpbWl0ZXJzIGJlZm9yZSBkaXNjdXNzaW5nIG9wdGlvbnMuIFN1Z2dlc3RlZCBhcmVhcyB0byBldmFsdWF0ZTogQ0JDLCBmZXJyaXRpbi9pcm9uIHN0dWRpZXMsIG1ldGFib2xpYyBwYW5lbCwgdml0YW1pbiBELCB0aHlyb2lkLCBhbmQgYSBob3Jtb25lIGJhc2VsaW5lOyBhc3Nlc3MgdHJhaW5pbmcgbG9hZCwgc2xlZXAgYW5kIG51dHJpdGlvbiwgYW5kIGNvbnNpZGVyIGZvY3VzZWQgbXVzY3Vsb3NrZWxldGFsIGV2YWx1YXRpb24gb2YgdGhlIHNob3VsZGVyLiBBbnkgcGVyZm9ybWFuY2Utc3VwcG9ydCBkaXNjdXNzaW9uIGZvbGxvd3MgY2xpbmljYWwgYXNzZXNzbWVudC4gQ29uZmlybSBiZWZvcmUgYW55IHRyZWF0bWVudCBkZWNpc2lvbi4g4oCUIEFJLWRyYWZ0ZWQgY29uc2lkZXJhdGlvbnMgZnJvbSB0aGUgcXVlc3Rpb25uYWlyZTsgbm90IGEgZGlhZ25vc2lzIG9yIHRyZWF0bWVudCByZWNvbW1lbmRhdGlvbi4gVGhlIHByb3ZpZGVyIG1ha2VzIGFuZCBzaWducyBldmVyeSBjbGluaWNhbCBkZWNpc2lvbi4ifQ=="
 },
 {
  "tag": "Longevity",
  "submitted": "2026-07-08",
  "name": "Daniel Pham",
  "sex": "Male",
  "dob": "1978-01-25",
  "cc": "Feeling well and performing at a high level, but wants a proactive, data-driven longevity plan to stay sharp, lean and healthy into his 70s and 80s. No specific complaints.",
  "scores": {
   "energy": 7,
   "libido": 6,
   "sleep": 6,
   "mood": 7
  },
  "meds": "Vitamin D3 2000 IU — daily\nMagnesium — nightly\nOmega-3 — daily",
  "allergies": "NKDA",
  "labs": [
   "Executive_physical_panel_2026-06-18.pdf",
   "Advanced_lipids_2026-06-18.pdf"
  ],
  "flags": [
   "Longevity optimization",
   "Preventive health",
   "Body composition"
  ],
  "aiHPI": "48-year-old high-functioning executive, asymptomatic, presenting for proactive longevity and preventive optimization rather than a specific complaint. Reports good baseline energy and performance, a busy travel schedule, and interest in a data-driven plan for healthspan. No cardiopulmonary, neurologic or metabolic symptoms reported on intake. Goals: maintain cognition, body composition and long-term health. Patient self-ratings (0–10): energy 7, libido 6, sleep 6, mood 7. Provider to confirm on exam.",
  "aiROS": "Constitutional: well, energy preserved. Cardiovascular/Resp: asymptomatic. Neuro/Psych: sharp, mood positive. Sleep: adequate but travel-disrupted. Remainder negative per questionnaire; provider completes exam-based review.",
  "aiConsider": "For a healthy optimizer, the value is in a thorough baseline and early risk detection. Suggested areas to review from the executive panel and to consider: advanced lipids (ApoB, Lp(a)), fasting glucose/insulin and HbA1c, hs-CRP, comprehensive metabolic and thyroid panels, vitamin D and B12, a hormone baseline, and age-appropriate cancer and coronary-calcium screening discussions; pair with body-composition and fitness metrics. Confirm interpretation clinically before any treatment decision. — AI-drafted considerations from the questionnaire; not a diagnosis or treatment recommendation. The provider makes and signs every clinical decision.",
  "b64": "eyJuYW1lIjoiRGFuaWVsIFBoYW0iLCJzZXgiOiJNYWxlIiwiZG9iIjoiMTk3OC0wMS0yNSIsImNjIjoiRmVlbGluZyB3ZWxsIGFuZCBwZXJmb3JtaW5nIGF0IGEgaGlnaCBsZXZlbCwgYnV0IHdhbnRzIGEgcHJvYWN0aXZlLCBkYXRhLWRyaXZlbiBsb25nZXZpdHkgcGxhbiB0byBzdGF5IHNoYXJwLCBsZWFuIGFuZCBoZWFsdGh5IGludG8gaGlzIDcwcyBhbmQgODBzLiBObyBzcGVjaWZpYyBjb21wbGFpbnRzLiIsInNjb3JlcyI6eyJlbmVyZ3kiOjcsImxpYmlkbyI6Niwic2xlZXAiOjYsIm1vb2QiOjd9LCJtZWRzIjoiVml0YW1pbiBEMyAyMDAwIElVIOKAlCBkYWlseVxuTWFnbmVzaXVtIOKAlCBuaWdodGx5XG5PbWVnYS0zIOKAlCBkYWlseSIsImFsbGVyZ2llcyI6Ik5LREEiLCJsYWJzIjpbIkV4ZWN1dGl2ZV9waHlzaWNhbF9wYW5lbF8yMDI2LTA2LTE4LnBkZiIsIkFkdmFuY2VkX2xpcGlkc18yMDI2LTA2LTE4LnBkZiJdLCJmbGFncyI6WyJMb25nZXZpdHkgb3B0aW1pemF0aW9uIiwiUHJldmVudGl2ZSBoZWFsdGgiLCJCb2R5IGNvbXBvc2l0aW9uIl0sImFpSFBJIjoiNDgteWVhci1vbGQgaGlnaC1mdW5jdGlvbmluZyBleGVjdXRpdmUsIGFzeW1wdG9tYXRpYywgcHJlc2VudGluZyBmb3IgcHJvYWN0aXZlIGxvbmdldml0eSBhbmQgcHJldmVudGl2ZSBvcHRpbWl6YXRpb24gcmF0aGVyIHRoYW4gYSBzcGVjaWZpYyBjb21wbGFpbnQuIFJlcG9ydHMgZ29vZCBiYXNlbGluZSBlbmVyZ3kgYW5kIHBlcmZvcm1hbmNlLCBhIGJ1c3kgdHJhdmVsIHNjaGVkdWxlLCBhbmQgaW50ZXJlc3QgaW4gYSBkYXRhLWRyaXZlbiBwbGFuIGZvciBoZWFsdGhzcGFuLiBObyBjYXJkaW9wdWxtb25hcnksIG5ldXJvbG9naWMgb3IgbWV0YWJvbGljIHN5bXB0b21zIHJlcG9ydGVkIG9uIGludGFrZS4gR29hbHM6IG1haW50YWluIGNvZ25pdGlvbiwgYm9keSBjb21wb3NpdGlvbiBhbmQgbG9uZy10ZXJtIGhlYWx0aC4gUGF0aWVudCBzZWxmLXJhdGluZ3MgKDDigJMxMCk6IGVuZXJneSA3LCBsaWJpZG8gNiwgc2xlZXAgNiwgbW9vZCA3LiBQcm92aWRlciB0byBjb25maXJtIG9uIGV4YW0uIiwiYWlST1MiOiJDb25zdGl0dXRpb25hbDogd2VsbCwgZW5lcmd5IHByZXNlcnZlZC4gQ2FyZGlvdmFzY3VsYXIvUmVzcDogYXN5bXB0b21hdGljLiBOZXVyby9Qc3ljaDogc2hhcnAsIG1vb2QgcG9zaXRpdmUuIFNsZWVwOiBhZGVxdWF0ZSBidXQgdHJhdmVsLWRpc3J1cHRlZC4gUmVtYWluZGVyIG5lZ2F0aXZlIHBlciBxdWVzdGlvbm5haXJlOyBwcm92aWRlciBjb21wbGV0ZXMgZXhhbS1iYXNlZCByZXZpZXcuIiwiYWlDb25zaWRlciI6IkZvciBhIGhlYWx0aHkgb3B0aW1pemVyLCB0aGUgdmFsdWUgaXMgaW4gYSB0aG9yb3VnaCBiYXNlbGluZSBhbmQgZWFybHkgcmlzayBkZXRlY3Rpb24uIFN1Z2dlc3RlZCBhcmVhcyB0byByZXZpZXcgZnJvbSB0aGUgZXhlY3V0aXZlIHBhbmVsIGFuZCB0byBjb25zaWRlcjogYWR2YW5jZWQgbGlwaWRzIChBcG9CLCBMcChhKSksIGZhc3RpbmcgZ2x1Y29zZS9pbnN1bGluIGFuZCBIYkExYywgaHMtQ1JQLCBjb21wcmVoZW5zaXZlIG1ldGFib2xpYyBhbmQgdGh5cm9pZCBwYW5lbHMsIHZpdGFtaW4gRCBhbmQgQjEyLCBhIGhvcm1vbmUgYmFzZWxpbmUsIGFuZCBhZ2UtYXBwcm9wcmlhdGUgY2FuY2VyIGFuZCBjb3JvbmFyeS1jYWxjaXVtIHNjcmVlbmluZyBkaXNjdXNzaW9uczsgcGFpciB3aXRoIGJvZHktY29tcG9zaXRpb24gYW5kIGZpdG5lc3MgbWV0cmljcy4gQ29uZmlybSBpbnRlcnByZXRhdGlvbiBjbGluaWNhbGx5IGJlZm9yZSBhbnkgdHJlYXRtZW50IGRlY2lzaW9uLiDigJQgQUktZHJhZnRlZCBjb25zaWRlcmF0aW9ucyBmcm9tIHRoZSBxdWVzdGlvbm5haXJlOyBub3QgYSBkaWFnbm9zaXMgb3IgdHJlYXRtZW50IHJlY29tbWVuZGF0aW9uLiBUaGUgcHJvdmlkZXIgbWFrZXMgYW5kIHNpZ25zIGV2ZXJ5IGNsaW5pY2FsIGRlY2lzaW9uLiJ9"
 },
 {
  "tag": "Brain-fog",
  "submitted": "2026-07-08",
  "name": "Vũ Thị Lan",
  "sex": "Female",
  "dob": "1981-08-30",
  "cc": "Increasing mental fogginess, forgetfulness and trouble concentrating over the past ~6 months that is affecting her work. Worried about her memory and wants to know what is driving it.",
  "scores": {
   "energy": 4,
   "libido": 4,
   "sleep": 4,
   "mood": 4
  },
  "meds": "Multivitamin — daily",
  "allergies": "NKDA",
  "labs": [
   "Prior_bloodwork_2026-03-15.pdf"
  ],
  "flags": [
   "Brain fog / cognition",
   "Memory concerns",
   "Poor concentration"
  ],
  "aiHPI": "44-year-old woman reporting ~6 months of progressive \"brain fog,\" forgetfulness and impaired concentration affecting work performance. Reports concurrent fatigue and variable sleep; of perimenopausal age but cycles not characterized on intake. No focal neurologic deficit, headache red flags or language disturbance reported. Goals: identify contributors to cognitive symptoms. Patient self-ratings (0–10): energy 4, libido 4, sleep 4, mood 4. Provider to confirm on exam.",
  "aiROS": "Neuro/Psych: reduced concentration, forgetfulness, low mood; no focal deficits reported. Constitutional: fatigue. Sleep: variable, unrefreshing. Endocrine: age-appropriate hormonal transition not yet characterized. Remainder negative per questionnaire; provider completes exam-based review.",
  "aiConsider": "Cognitive symptoms at this age are commonly multifactorial — sleep, mood, thyroid, hormonal transition and nutrient status all merit evaluation before narrowing. Suggested areas to review: thyroid panel, CBC, ferritin, vitamin B12 and D, metabolic panel and fasting glucose; screen for depression/anxiety and sleep quality, and characterize menstrual/perimenopausal status. Confirm findings clinically before any treatment decision. — AI-drafted considerations from the questionnaire; not a diagnosis or treatment recommendation. The provider makes and signs every clinical decision.",
  "b64": "eyJuYW1lIjoiVsWpIFRo4buLIExhbiIsInNleCI6IkZlbWFsZSIsImRvYiI6IjE5ODEtMDgtMzAiLCJjYyI6IkluY3JlYXNpbmcgbWVudGFsIGZvZ2dpbmVzcywgZm9yZ2V0ZnVsbmVzcyBhbmQgdHJvdWJsZSBjb25jZW50cmF0aW5nIG92ZXIgdGhlIHBhc3QgfjYgbW9udGhzIHRoYXQgaXMgYWZmZWN0aW5nIGhlciB3b3JrLiBXb3JyaWVkIGFib3V0IGhlciBtZW1vcnkgYW5kIHdhbnRzIHRvIGtub3cgd2hhdCBpcyBkcml2aW5nIGl0LiIsInNjb3JlcyI6eyJlbmVyZ3kiOjQsImxpYmlkbyI6NCwic2xlZXAiOjQsIm1vb2QiOjR9LCJtZWRzIjoiTXVsdGl2aXRhbWluIOKAlCBkYWlseSIsImFsbGVyZ2llcyI6Ik5LREEiLCJsYWJzIjpbIlByaW9yX2Jsb29kd29ya18yMDI2LTAzLTE1LnBkZiJdLCJmbGFncyI6WyJCcmFpbiBmb2cgLyBjb2duaXRpb24iLCJNZW1vcnkgY29uY2VybnMiLCJQb29yIGNvbmNlbnRyYXRpb24iXSwiYWlIUEkiOiI0NC15ZWFyLW9sZCB3b21hbiByZXBvcnRpbmcgfjYgbW9udGhzIG9mIHByb2dyZXNzaXZlIFwiYnJhaW4gZm9nLFwiIGZvcmdldGZ1bG5lc3MgYW5kIGltcGFpcmVkIGNvbmNlbnRyYXRpb24gYWZmZWN0aW5nIHdvcmsgcGVyZm9ybWFuY2UuIFJlcG9ydHMgY29uY3VycmVudCBmYXRpZ3VlIGFuZCB2YXJpYWJsZSBzbGVlcDsgb2YgcGVyaW1lbm9wYXVzYWwgYWdlIGJ1dCBjeWNsZXMgbm90IGNoYXJhY3Rlcml6ZWQgb24gaW50YWtlLiBObyBmb2NhbCBuZXVyb2xvZ2ljIGRlZmljaXQsIGhlYWRhY2hlIHJlZCBmbGFncyBvciBsYW5ndWFnZSBkaXN0dXJiYW5jZSByZXBvcnRlZC4gR29hbHM6IGlkZW50aWZ5IGNvbnRyaWJ1dG9ycyB0byBjb2duaXRpdmUgc3ltcHRvbXMuIFBhdGllbnQgc2VsZi1yYXRpbmdzICgw4oCTMTApOiBlbmVyZ3kgNCwgbGliaWRvIDQsIHNsZWVwIDQsIG1vb2QgNC4gUHJvdmlkZXIgdG8gY29uZmlybSBvbiBleGFtLiIsImFpUk9TIjoiTmV1cm8vUHN5Y2g6IHJlZHVjZWQgY29uY2VudHJhdGlvbiwgZm9yZ2V0ZnVsbmVzcywgbG93IG1vb2Q7IG5vIGZvY2FsIGRlZmljaXRzIHJlcG9ydGVkLiBDb25zdGl0dXRpb25hbDogZmF0aWd1ZS4gU2xlZXA6IHZhcmlhYmxlLCB1bnJlZnJlc2hpbmcuIEVuZG9jcmluZTogYWdlLWFwcHJvcHJpYXRlIGhvcm1vbmFsIHRyYW5zaXRpb24gbm90IHlldCBjaGFyYWN0ZXJpemVkLiBSZW1haW5kZXIgbmVnYXRpdmUgcGVyIHF1ZXN0aW9ubmFpcmU7IHByb3ZpZGVyIGNvbXBsZXRlcyBleGFtLWJhc2VkIHJldmlldy4iLCJhaUNvbnNpZGVyIjoiQ29nbml0aXZlIHN5bXB0b21zIGF0IHRoaXMgYWdlIGFyZSBjb21tb25seSBtdWx0aWZhY3RvcmlhbCDigJQgc2xlZXAsIG1vb2QsIHRoeXJvaWQsIGhvcm1vbmFsIHRyYW5zaXRpb24gYW5kIG51dHJpZW50IHN0YXR1cyBhbGwgbWVyaXQgZXZhbHVhdGlvbiBiZWZvcmUgbmFycm93aW5nLiBTdWdnZXN0ZWQgYXJlYXMgdG8gcmV2aWV3OiB0aHlyb2lkIHBhbmVsLCBDQkMsIGZlcnJpdGluLCB2aXRhbWluIEIxMiBhbmQgRCwgbWV0YWJvbGljIHBhbmVsIGFuZCBmYXN0aW5nIGdsdWNvc2U7IHNjcmVlbiBmb3IgZGVwcmVzc2lvbi9hbnhpZXR5IGFuZCBzbGVlcCBxdWFsaXR5LCBhbmQgY2hhcmFjdGVyaXplIG1lbnN0cnVhbC9wZXJpbWVub3BhdXNhbCBzdGF0dXMuIENvbmZpcm0gZmluZGluZ3MgY2xpbmljYWxseSBiZWZvcmUgYW55IHRyZWF0bWVudCBkZWNpc2lvbi4g4oCUIEFJLWRyYWZ0ZWQgY29uc2lkZXJhdGlvbnMgZnJvbSB0aGUgcXVlc3Rpb25uYWlyZTsgbm90IGEgZGlhZ25vc2lzIG9yIHRyZWF0bWVudCByZWNvbW1lbmRhdGlvbi4gVGhlIHByb3ZpZGVyIG1ha2VzIGFuZCBzaWducyBldmVyeSBjbGluaWNhbCBkZWNpc2lvbi4ifQ=="
 },
 {
  "tag": "Joint-pain",
  "submitted": "2026-07-07",
  "name": "Margaret O'Brien",
  "sex": "Female",
  "dob": "1956-05-12",
  "cc": "Aching, stiff joints in the hands, knees and hips that are worse in the mornings, with reduced grip and difficulty on stairs over the past year. Wants to stay mobile and reduce inflammation.",
  "scores": {
   "energy": 5,
   "libido": 4,
   "sleep": 4,
   "mood": 5
  },
  "meds": "Acetaminophen — as needed for pain\nCalcium + vitamin D — daily\nAtorvastatin 20 mg — once daily",
  "allergies": "Codeine (nausea)",
  "labs": [
   "Inflammatory_markers_CRP_ESR_2026-06-05.pdf",
   "Hand_knee_Xray_report_2026-05-20.pdf"
  ],
  "flags": [
   "Joint pain / stiffness",
   "Morning stiffness",
   "Mobility"
  ],
  "aiHPI": "70-year-old woman with ~1 year of aching, stiff joints involving the hands, knees and hips, worse in the mornings, with reduced grip strength and difficulty on stairs. Reports intermittent acetaminophen use with partial relief. Duration of morning stiffness, swelling pattern, fever or rash not fully characterized on intake. Goals: preserve mobility and reduce joint pain and inflammation. Patient self-ratings (0–10): energy 5, libido 4, sleep 4, mood 5. Provider to confirm on exam.",
  "aiROS": "Musculoskeletal: polyarticular aching and stiffness (hands, knees, hips), morning predominance, reduced grip. Constitutional: no fever or weight loss reported. Skin: no rash reported. Sleep: disrupted by discomfort. Remainder negative per questionnaire; provider completes exam-based review.",
  "aiConsider": "Reported pattern could reflect degenerative and/or inflammatory joint disease; distinguishing these guides everything downstream. Suggested review of the uploaded imaging and inflammatory markers plus, as indicated: ESR/CRP, RF/anti-CCP and ANA if an inflammatory pattern is suspected, uric acid, CBC and metabolic panel, and vitamin D; characterize stiffness duration and joint distribution on exam. Confirm clinically before any treatment decision. — AI-drafted considerations from the questionnaire; not a diagnosis or treatment recommendation. The provider makes and signs every clinical decision.",
  "b64": "eyJuYW1lIjoiTWFyZ2FyZXQgTydCcmllbiIsInNleCI6IkZlbWFsZSIsImRvYiI6IjE5NTYtMDUtMTIiLCJjYyI6IkFjaGluZywgc3RpZmYgam9pbnRzIGluIHRoZSBoYW5kcywga25lZXMgYW5kIGhpcHMgdGhhdCBhcmUgd29yc2UgaW4gdGhlIG1vcm5pbmdzLCB3aXRoIHJlZHVjZWQgZ3JpcCBhbmQgZGlmZmljdWx0eSBvbiBzdGFpcnMgb3ZlciB0aGUgcGFzdCB5ZWFyLiBXYW50cyB0byBzdGF5IG1vYmlsZSBhbmQgcmVkdWNlIGluZmxhbW1hdGlvbi4iLCJzY29yZXMiOnsiZW5lcmd5Ijo1LCJsaWJpZG8iOjQsInNsZWVwIjo0LCJtb29kIjo1fSwibWVkcyI6IkFjZXRhbWlub3BoZW4g4oCUIGFzIG5lZWRlZCBmb3IgcGFpblxuQ2FsY2l1bSArIHZpdGFtaW4gRCDigJQgZGFpbHlcbkF0b3J2YXN0YXRpbiAyMCBtZyDigJQgb25jZSBkYWlseSIsImFsbGVyZ2llcyI6IkNvZGVpbmUgKG5hdXNlYSkiLCJsYWJzIjpbIkluZmxhbW1hdG9yeV9tYXJrZXJzX0NSUF9FU1JfMjAyNi0wNi0wNS5wZGYiLCJIYW5kX2tuZWVfWHJheV9yZXBvcnRfMjAyNi0wNS0yMC5wZGYiXSwiZmxhZ3MiOlsiSm9pbnQgcGFpbiAvIHN0aWZmbmVzcyIsIk1vcm5pbmcgc3RpZmZuZXNzIiwiTW9iaWxpdHkiXSwiYWlIUEkiOiI3MC15ZWFyLW9sZCB3b21hbiB3aXRoIH4xIHllYXIgb2YgYWNoaW5nLCBzdGlmZiBqb2ludHMgaW52b2x2aW5nIHRoZSBoYW5kcywga25lZXMgYW5kIGhpcHMsIHdvcnNlIGluIHRoZSBtb3JuaW5ncywgd2l0aCByZWR1Y2VkIGdyaXAgc3RyZW5ndGggYW5kIGRpZmZpY3VsdHkgb24gc3RhaXJzLiBSZXBvcnRzIGludGVybWl0dGVudCBhY2V0YW1pbm9waGVuIHVzZSB3aXRoIHBhcnRpYWwgcmVsaWVmLiBEdXJhdGlvbiBvZiBtb3JuaW5nIHN0aWZmbmVzcywgc3dlbGxpbmcgcGF0dGVybiwgZmV2ZXIgb3IgcmFzaCBub3QgZnVsbHkgY2hhcmFjdGVyaXplZCBvbiBpbnRha2UuIEdvYWxzOiBwcmVzZXJ2ZSBtb2JpbGl0eSBhbmQgcmVkdWNlIGpvaW50IHBhaW4gYW5kIGluZmxhbW1hdGlvbi4gUGF0aWVudCBzZWxmLXJhdGluZ3MgKDDigJMxMCk6IGVuZXJneSA1LCBsaWJpZG8gNCwgc2xlZXAgNCwgbW9vZCA1LiBQcm92aWRlciB0byBjb25maXJtIG9uIGV4YW0uIiwiYWlST1MiOiJNdXNjdWxvc2tlbGV0YWw6IHBvbHlhcnRpY3VsYXIgYWNoaW5nIGFuZCBzdGlmZm5lc3MgKGhhbmRzLCBrbmVlcywgaGlwcyksIG1vcm5pbmcgcHJlZG9taW5hbmNlLCByZWR1Y2VkIGdyaXAuIENvbnN0aXR1dGlvbmFsOiBubyBmZXZlciBvciB3ZWlnaHQgbG9zcyByZXBvcnRlZC4gU2tpbjogbm8gcmFzaCByZXBvcnRlZC4gU2xlZXA6IGRpc3J1cHRlZCBieSBkaXNjb21mb3J0LiBSZW1haW5kZXIgbmVnYXRpdmUgcGVyIHF1ZXN0aW9ubmFpcmU7IHByb3ZpZGVyIGNvbXBsZXRlcyBleGFtLWJhc2VkIHJldmlldy4iLCJhaUNvbnNpZGVyIjoiUmVwb3J0ZWQgcGF0dGVybiBjb3VsZCByZWZsZWN0IGRlZ2VuZXJhdGl2ZSBhbmQvb3IgaW5mbGFtbWF0b3J5IGpvaW50IGRpc2Vhc2U7IGRpc3Rpbmd1aXNoaW5nIHRoZXNlIGd1aWRlcyBldmVyeXRoaW5nIGRvd25zdHJlYW0uIFN1Z2dlc3RlZCByZXZpZXcgb2YgdGhlIHVwbG9hZGVkIGltYWdpbmcgYW5kIGluZmxhbW1hdG9yeSBtYXJrZXJzIHBsdXMsIGFzIGluZGljYXRlZDogRVNSL0NSUCwgUkYvYW50aS1DQ1AgYW5kIEFOQSBpZiBhbiBpbmZsYW1tYXRvcnkgcGF0dGVybiBpcyBzdXNwZWN0ZWQsIHVyaWMgYWNpZCwgQ0JDIGFuZCBtZXRhYm9saWMgcGFuZWwsIGFuZCB2aXRhbWluIEQ7IGNoYXJhY3Rlcml6ZSBzdGlmZm5lc3MgZHVyYXRpb24gYW5kIGpvaW50IGRpc3RyaWJ1dGlvbiBvbiBleGFtLiBDb25maXJtIGNsaW5pY2FsbHkgYmVmb3JlIGFueSB0cmVhdG1lbnQgZGVjaXNpb24uIOKAlCBBSS1kcmFmdGVkIGNvbnNpZGVyYXRpb25zIGZyb20gdGhlIHF1ZXN0aW9ubmFpcmU7IG5vdCBhIGRpYWdub3NpcyBvciB0cmVhdG1lbnQgcmVjb21tZW5kYXRpb24uIFRoZSBwcm92aWRlciBtYWtlcyBhbmQgc2lnbnMgZXZlcnkgY2xpbmljYWwgZGVjaXNpb24uIn0="
 },
 {
  "tag": "IBS",
  "submitted": "2026-07-06",
  "name": "Đặng Văn Hải",
  "sex": "Male",
  "dob": "1987-11-20",
  "cc": "Recurring bloating, abdominal cramping and alternating constipation and loose stools for over a year, worse with stress and certain foods. Wants relief and reassurance that nothing is being missed.",
  "scores": {
   "energy": 4,
   "libido": 5,
   "sleep": 5,
   "mood": 4
  },
  "meds": "Over-the-counter antacids — as needed\nProbiotic — daily",
  "allergies": "NKDA",
  "labs": [
   "Stool_test_report_2026-05-12.pdf",
   "CBC_CMP_2026-05-12.pdf"
  ],
  "flags": [
   "Digestive / IBS",
   "Bloating",
   "Food sensitivity"
  ],
  "aiHPI": "38-year-old man with >12 months of bloating, crampy abdominal pain and alternating constipation and loose stools, worse with stress and specific foods. No rectal bleeding, nocturnal symptoms, unintended weight loss or fever reported on intake. Goals: symptom relief and reassurance that nothing is being missed. Patient self-ratings (0–10): energy 4, libido 5, sleep 5, mood 4. Provider to confirm on exam.",
  "aiROS": "GI: bloating, cramping, altered bowel habit; no reported hematochezia or nocturnal diarrhea. Constitutional: no weight loss or fever reported. Psych: stress-symptom correlation noted. Remainder negative per questionnaire; provider completes exam-based review.",
  "aiConsider": "Reported pattern is consistent with a functional bowel / IBS-type picture, but alarm features must be excluded first. Suggested review of the uploaded stool and blood tests plus, as indicated: CBC, CMP, CRP, celiac serology, TSH, and fecal calprotectin; take a careful diet, stress and alarm-symptom history and consider referral for endoscopic evaluation if red flags emerge. Confirm clinically before any treatment decision. — AI-drafted considerations from the questionnaire; not a diagnosis or treatment recommendation. The provider makes and signs every clinical decision.",
  "b64": "eyJuYW1lIjoixJDhurduZyBWxINuIEjhuqNpIiwic2V4IjoiTWFsZSIsImRvYiI6IjE5ODctMTEtMjAiLCJjYyI6IlJlY3VycmluZyBibG9hdGluZywgYWJkb21pbmFsIGNyYW1waW5nIGFuZCBhbHRlcm5hdGluZyBjb25zdGlwYXRpb24gYW5kIGxvb3NlIHN0b29scyBmb3Igb3ZlciBhIHllYXIsIHdvcnNlIHdpdGggc3RyZXNzIGFuZCBjZXJ0YWluIGZvb2RzLiBXYW50cyByZWxpZWYgYW5kIHJlYXNzdXJhbmNlIHRoYXQgbm90aGluZyBpcyBiZWluZyBtaXNzZWQuIiwic2NvcmVzIjp7ImVuZXJneSI6NCwibGliaWRvIjo1LCJzbGVlcCI6NSwibW9vZCI6NH0sIm1lZHMiOiJPdmVyLXRoZS1jb3VudGVyIGFudGFjaWRzIOKAlCBhcyBuZWVkZWRcblByb2Jpb3RpYyDigJQgZGFpbHkiLCJhbGxlcmdpZXMiOiJOS0RBIiwibGFicyI6WyJTdG9vbF90ZXN0X3JlcG9ydF8yMDI2LTA1LTEyLnBkZiIsIkNCQ19DTVBfMjAyNi0wNS0xMi5wZGYiXSwiZmxhZ3MiOlsiRGlnZXN0aXZlIC8gSUJTIiwiQmxvYXRpbmciLCJGb29kIHNlbnNpdGl2aXR5Il0sImFpSFBJIjoiMzgteWVhci1vbGQgbWFuIHdpdGggPjEyIG1vbnRocyBvZiBibG9hdGluZywgY3JhbXB5IGFiZG9taW5hbCBwYWluIGFuZCBhbHRlcm5hdGluZyBjb25zdGlwYXRpb24gYW5kIGxvb3NlIHN0b29scywgd29yc2Ugd2l0aCBzdHJlc3MgYW5kIHNwZWNpZmljIGZvb2RzLiBObyByZWN0YWwgYmxlZWRpbmcsIG5vY3R1cm5hbCBzeW1wdG9tcywgdW5pbnRlbmRlZCB3ZWlnaHQgbG9zcyBvciBmZXZlciByZXBvcnRlZCBvbiBpbnRha2UuIEdvYWxzOiBzeW1wdG9tIHJlbGllZiBhbmQgcmVhc3N1cmFuY2UgdGhhdCBub3RoaW5nIGlzIGJlaW5nIG1pc3NlZC4gUGF0aWVudCBzZWxmLXJhdGluZ3MgKDDigJMxMCk6IGVuZXJneSA0LCBsaWJpZG8gNSwgc2xlZXAgNSwgbW9vZCA0LiBQcm92aWRlciB0byBjb25maXJtIG9uIGV4YW0uIiwiYWlST1MiOiJHSTogYmxvYXRpbmcsIGNyYW1waW5nLCBhbHRlcmVkIGJvd2VsIGhhYml0OyBubyByZXBvcnRlZCBoZW1hdG9jaGV6aWEgb3Igbm9jdHVybmFsIGRpYXJyaGVhLiBDb25zdGl0dXRpb25hbDogbm8gd2VpZ2h0IGxvc3Mgb3IgZmV2ZXIgcmVwb3J0ZWQuIFBzeWNoOiBzdHJlc3Mtc3ltcHRvbSBjb3JyZWxhdGlvbiBub3RlZC4gUmVtYWluZGVyIG5lZ2F0aXZlIHBlciBxdWVzdGlvbm5haXJlOyBwcm92aWRlciBjb21wbGV0ZXMgZXhhbS1iYXNlZCByZXZpZXcuIiwiYWlDb25zaWRlciI6IlJlcG9ydGVkIHBhdHRlcm4gaXMgY29uc2lzdGVudCB3aXRoIGEgZnVuY3Rpb25hbCBib3dlbCAvIElCUy10eXBlIHBpY3R1cmUsIGJ1dCBhbGFybSBmZWF0dXJlcyBtdXN0IGJlIGV4Y2x1ZGVkIGZpcnN0LiBTdWdnZXN0ZWQgcmV2aWV3IG9mIHRoZSB1cGxvYWRlZCBzdG9vbCBhbmQgYmxvb2QgdGVzdHMgcGx1cywgYXMgaW5kaWNhdGVkOiBDQkMsIENNUCwgQ1JQLCBjZWxpYWMgc2Vyb2xvZ3ksIFRTSCwgYW5kIGZlY2FsIGNhbHByb3RlY3RpbjsgdGFrZSBhIGNhcmVmdWwgZGlldCwgc3RyZXNzIGFuZCBhbGFybS1zeW1wdG9tIGhpc3RvcnkgYW5kIGNvbnNpZGVyIHJlZmVycmFsIGZvciBlbmRvc2NvcGljIGV2YWx1YXRpb24gaWYgcmVkIGZsYWdzIGVtZXJnZS4gQ29uZmlybSBjbGluaWNhbGx5IGJlZm9yZSBhbnkgdHJlYXRtZW50IGRlY2lzaW9uLiDigJQgQUktZHJhZnRlZCBjb25zaWRlcmF0aW9ucyBmcm9tIHRoZSBxdWVzdGlvbm5haXJlOyBub3QgYSBkaWFnbm9zaXMgb3IgdHJlYXRtZW50IHJlY29tbWVuZGF0aW9uLiBUaGUgcHJvdmlkZXIgbWFrZXMgYW5kIHNpZ25zIGV2ZXJ5IGNsaW5pY2FsIGRlY2lzaW9uLiJ9"
 },
 {
  "tag": "Burnout",
  "submitted": "2026-07-05",
  "name": "Rachel Kim",
  "sex": "Female",
  "dob": "1986-09-05",
  "cc": "Running on empty after two years of relentless work and caregiving — \"wired-but-tired\" evenings, crashing energy, salt cravings and feeling unable to cope with stress. Wonders about \"adrenal fatigue.\"",
  "scores": {
   "energy": 3,
   "libido": 3,
   "sleep": 3,
   "mood": 3
  },
  "meds": "Ashwagandha supplement — daily\nVitamin B-complex — daily",
  "allergies": "NKDA",
  "labs": [
   "Prior_thyroid_cortisol_2026-04-25.pdf"
  ],
  "flags": [
   "Burnout / stress",
   "Low energy",
   "Poor stress tolerance"
  ],
  "aiHPI": "39-year-old woman describing ~2 years of accumulating work and caregiving stress with profound fatigue, \"wired-but-tired\" evenings, morning energy crashes, salt cravings and reduced stress resilience. Sleep is short and non-restorative and mood is low. No syncope, hyperpigmentation or documented electrolyte abnormality reported on intake. Goals: recover energy and stress tolerance. Patient self-ratings (0–10): energy 3, libido 3, sleep 3, mood 3. Provider to confirm on exam.",
  "aiROS": "Constitutional: severe fatigue, low stamina, salt craving. Sleep: short, non-restorative, evening \"second wind.\" Psych: low mood, stress intolerance, possible anxiety. Endocrine: no syncope or hyperpigmentation reported. Remainder negative per questionnaire; provider completes exam-based review.",
  "aiConsider": "Reported \"burnout\" pattern overlaps with thyroid, mood, sleep, anemia and hormonal contributors, which are worth evaluating before attributing symptoms to stress alone. Suggested review of the uploaded thyroid/cortisol results plus, as indicated: TSH/free T4, CBC and ferritin, metabolic panel and glucose, vitamin D and B12, and a morning cortisol if clinically warranted; screen formally for depression, anxiety and sleep. Note that \"adrenal fatigue\" is not an established clinical diagnosis — evaluate for defined causes. Confirm clinically before any treatment decision. — AI-drafted considerations from the questionnaire; not a diagnosis or treatment recommendation. The provider makes and signs every clinical decision.",
  "b64": "eyJuYW1lIjoiUmFjaGVsIEtpbSIsInNleCI6IkZlbWFsZSIsImRvYiI6IjE5ODYtMDktMDUiLCJjYyI6IlJ1bm5pbmcgb24gZW1wdHkgYWZ0ZXIgdHdvIHllYXJzIG9mIHJlbGVudGxlc3Mgd29yayBhbmQgY2FyZWdpdmluZyDigJQgXCJ3aXJlZC1idXQtdGlyZWRcIiBldmVuaW5ncywgY3Jhc2hpbmcgZW5lcmd5LCBzYWx0IGNyYXZpbmdzIGFuZCBmZWVsaW5nIHVuYWJsZSB0byBjb3BlIHdpdGggc3RyZXNzLiBXb25kZXJzIGFib3V0IFwiYWRyZW5hbCBmYXRpZ3VlLlwiIiwic2NvcmVzIjp7ImVuZXJneSI6MywibGliaWRvIjozLCJzbGVlcCI6MywibW9vZCI6M30sIm1lZHMiOiJBc2h3YWdhbmRoYSBzdXBwbGVtZW50IOKAlCBkYWlseVxuVml0YW1pbiBCLWNvbXBsZXgg4oCUIGRhaWx5IiwiYWxsZXJnaWVzIjoiTktEQSIsImxhYnMiOlsiUHJpb3JfdGh5cm9pZF9jb3J0aXNvbF8yMDI2LTA0LTI1LnBkZiJdLCJmbGFncyI6WyJCdXJub3V0IC8gc3RyZXNzIiwiTG93IGVuZXJneSIsIlBvb3Igc3RyZXNzIHRvbGVyYW5jZSJdLCJhaUhQSSI6IjM5LXllYXItb2xkIHdvbWFuIGRlc2NyaWJpbmcgfjIgeWVhcnMgb2YgYWNjdW11bGF0aW5nIHdvcmsgYW5kIGNhcmVnaXZpbmcgc3RyZXNzIHdpdGggcHJvZm91bmQgZmF0aWd1ZSwgXCJ3aXJlZC1idXQtdGlyZWRcIiBldmVuaW5ncywgbW9ybmluZyBlbmVyZ3kgY3Jhc2hlcywgc2FsdCBjcmF2aW5ncyBhbmQgcmVkdWNlZCBzdHJlc3MgcmVzaWxpZW5jZS4gU2xlZXAgaXMgc2hvcnQgYW5kIG5vbi1yZXN0b3JhdGl2ZSBhbmQgbW9vZCBpcyBsb3cuIE5vIHN5bmNvcGUsIGh5cGVycGlnbWVudGF0aW9uIG9yIGRvY3VtZW50ZWQgZWxlY3Ryb2x5dGUgYWJub3JtYWxpdHkgcmVwb3J0ZWQgb24gaW50YWtlLiBHb2FsczogcmVjb3ZlciBlbmVyZ3kgYW5kIHN0cmVzcyB0b2xlcmFuY2UuIFBhdGllbnQgc2VsZi1yYXRpbmdzICgw4oCTMTApOiBlbmVyZ3kgMywgbGliaWRvIDMsIHNsZWVwIDMsIG1vb2QgMy4gUHJvdmlkZXIgdG8gY29uZmlybSBvbiBleGFtLiIsImFpUk9TIjoiQ29uc3RpdHV0aW9uYWw6IHNldmVyZSBmYXRpZ3VlLCBsb3cgc3RhbWluYSwgc2FsdCBjcmF2aW5nLiBTbGVlcDogc2hvcnQsIG5vbi1yZXN0b3JhdGl2ZSwgZXZlbmluZyBcInNlY29uZCB3aW5kLlwiIFBzeWNoOiBsb3cgbW9vZCwgc3RyZXNzIGludG9sZXJhbmNlLCBwb3NzaWJsZSBhbnhpZXR5LiBFbmRvY3JpbmU6IG5vIHN5bmNvcGUgb3IgaHlwZXJwaWdtZW50YXRpb24gcmVwb3J0ZWQuIFJlbWFpbmRlciBuZWdhdGl2ZSBwZXIgcXVlc3Rpb25uYWlyZTsgcHJvdmlkZXIgY29tcGxldGVzIGV4YW0tYmFzZWQgcmV2aWV3LiIsImFpQ29uc2lkZXIiOiJSZXBvcnRlZCBcImJ1cm5vdXRcIiBwYXR0ZXJuIG92ZXJsYXBzIHdpdGggdGh5cm9pZCwgbW9vZCwgc2xlZXAsIGFuZW1pYSBhbmQgaG9ybW9uYWwgY29udHJpYnV0b3JzLCB3aGljaCBhcmUgd29ydGggZXZhbHVhdGluZyBiZWZvcmUgYXR0cmlidXRpbmcgc3ltcHRvbXMgdG8gc3RyZXNzIGFsb25lLiBTdWdnZXN0ZWQgcmV2aWV3IG9mIHRoZSB1cGxvYWRlZCB0aHlyb2lkL2NvcnRpc29sIHJlc3VsdHMgcGx1cywgYXMgaW5kaWNhdGVkOiBUU0gvZnJlZSBUNCwgQ0JDIGFuZCBmZXJyaXRpbiwgbWV0YWJvbGljIHBhbmVsIGFuZCBnbHVjb3NlLCB2aXRhbWluIEQgYW5kIEIxMiwgYW5kIGEgbW9ybmluZyBjb3J0aXNvbCBpZiBjbGluaWNhbGx5IHdhcnJhbnRlZDsgc2NyZWVuIGZvcm1hbGx5IGZvciBkZXByZXNzaW9uLCBhbnhpZXR5IGFuZCBzbGVlcC4gTm90ZSB0aGF0IFwiYWRyZW5hbCBmYXRpZ3VlXCIgaXMgbm90IGFuIGVzdGFibGlzaGVkIGNsaW5pY2FsIGRpYWdub3NpcyDigJQgZXZhbHVhdGUgZm9yIGRlZmluZWQgY2F1c2VzLiBDb25maXJtIGNsaW5pY2FsbHkgYmVmb3JlIGFueSB0cmVhdG1lbnQgZGVjaXNpb24uIOKAlCBBSS1kcmFmdGVkIGNvbnNpZGVyYXRpb25zIGZyb20gdGhlIHF1ZXN0aW9ubmFpcmU7IG5vdCBhIGRpYWdub3NpcyBvciB0cmVhdG1lbnQgcmVjb21tZW5kYXRpb24uIFRoZSBwcm92aWRlciBtYWtlcyBhbmQgc2lnbnMgZXZlcnkgY2xpbmljYWwgZGVjaXNpb24uIn0="
 }
];

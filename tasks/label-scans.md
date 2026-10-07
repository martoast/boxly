# Label scans — warehouse uploads label photos → name + tracking number (Alex 2026-10-07)

Mauricio (San Diego warehouse) photographs every label as packages arrive (60–100/day), then uploads them all
at once. Each photo becomes a row: recipient name + exact tracking number, to tell the client on WhatsApp.
Admin page for Alex to try it; same page under /employee for Mauricio. API side: boxly-api tasks/label-scans.md.

Measured first (scratchpad, 11 real photos): the vision model misread 5/9 printed tracking numbers; barcodes
decoded exactly 11/11 (at the photo's own size, 1.5× retry). Names from the model: 32/33. Shippo can't give names
(carriers don't share them) and can't track LaserShip/TForce/Better Trucks/Amazon — not used here.

- [x] utils/labelTracking.ts — barcode text → tracking/carrier (USPS IMpb, UPS, FedEx 96, LaserShip, Better Trucks,
      TForce, Amazon, OnTrac; drops ZIP routing, SSCC, store junk); assignTracking picks each label's barcode by the
      model's printed read (UPS over USPS on SurePost; one barcode per label). Tests: utils/labelTracking.test.mjs
- [x] utils/labelPhoto.ts — browser: zxing-wasm decode (own size, then 1.5×, under iOS's 16.7 MP canvas cap),
      1600 px JPEG. wasm self-hosted (?url), only loaded on the label-scan pages
- [x] server/api/label-read.post.ts + server/utils/labelRead.ts — admin/employee only (session cookie → API /user,
      cached 5 min); OpenAI vision (OPENAI_LABEL_MODEL, default gpt-6-luna, reasoning off, 12 s timeout + 1 retry)
- [x] components/admin/AdminLabelScans.vue — upload many photos, 4 at a time, rows appear as each finishes;
      if the name read fails the barcode result is still saved, flagged "Revisar"; expand a row: photo, all data,
      edit name/tracking, clear flag, copy WhatsApp message, delete. Pages admin/ + employee/label-scans
- [x] Sidebar, command palette, employee tab

## Review
- Verified: unit tests (9), nuxi build, zxing-wasm decode of all 11 photos in node (same library, same pixels),
  the server read on all 11 photos (tracking exact 11/11, names right). Headless Chromium doesn't run on this box,
  so the in-browser path (canvas + wasm load) is verified by the build output, not a live phone — first real
  upload is the test.
- Not done: matching names to the client list (would fix 1-letter misreads); per-client grouping.

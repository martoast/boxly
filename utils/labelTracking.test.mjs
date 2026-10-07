// node --experimental-strip-types utils/labelTracking.test.mjs
// Barcode strings are the real decodes (ZXing + zbar) of the first 11 warehouse label photos, 2026-10-07.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { trackingFrom, trackingsFrom, assignTracking, readDistance } from './labelTracking.ts'

const GS = '\u001d'

test('carriers from real barcodes', () => {
  assert.deepEqual(trackingFrom('1Z02721A0322088531'), { tracking: '1Z02721A0322088531', carrier: 'ups' })
  assert.deepEqual(trackingFrom('BTS_054002QMMA7'), { tracking: 'BTS_054002QMMA7', carrier: 'better_trucks' })
  assert.deepEqual(trackingFrom('1LSCXLV000VI163'), { tracking: '1LSCXLV000VI163', carrier: 'lasership' })
  assert.deepEqual(trackingFrom(`42092173${GS}9400150106151227876306`), { tracking: '9400150106151227876306', carrier: 'usps' })
  assert.deepEqual(trackingFrom('420921739400150106151227876306'), { tracking: '9400150106151227876306', carrier: 'usps' }) // zbar drops the GS
  assert.deepEqual(trackingFrom('42092173<GS>9200190324189104477539'), { tracking: '9200190324189104477539', carrier: 'usps' }) // escaped GS
  assert.deepEqual(trackingFrom('4209217392395903097714581238496053'), { tracking: '92395903097714581238496053', carrier: 'usps' })
  assert.deepEqual(trackingFrom('TF105840000312323969'), { tracking: '0000312323969', carrier: 'tforce' })
  assert.deepEqual(trackingFrom('9622080100008275361000540469486236'), { tracking: '540469486236', carrier: 'fedex' })
})

test('routing codes, cartons and store junk are not tracking numbers', () => {
  for (const junk of ['42092173', '420921732717', '420921730000', '00006629191162909278', '00006372953228713060', 'SPB8wBbvp1_001_v', '090620376', '', null]) {
    assert.equal(trackingFrom(junk), null, String(junk))
  }
})

test('LaserShip 2D code carries the recipient name', () => {
  const t = trackingFrom('1LSCXLV000VP9GS|2|CXLV|RADLRLCA|GRND|SAN|92173|US|CA|92173-2717|SAN YSIDRO|157 VIRGINIA AVE|FGM Daniel Arellano|FGM Daniel Arellano|835 SAN YSIDRO|')
  assert.equal(t.tracking, '1LSCXLV000VP9GS')
  assert.equal(t.name, 'FGM Daniel Arellano')
})

test('one photo: duplicates merge, junk dropped', () => {
  const codes = trackingsFrom(['42092173', '1Z22FW26YN93529953', `42092173${GS}92395903097714581238496053`, '4209217392395903097714581238496053', '00006372953228713060'])
  assert.deepEqual(codes.map((c) => c.tracking), ['1Z22FW26YN93529953', '92395903097714581238496053'])
})

test('the model read picks the barcode, even when it garbled the digits', () => {
  const codes = trackingsFrom(['1LSCXLV000VI163'])
  // the model's real misread of this label
  const [r] = assignTracking(['1LSCXLV000U1163'], codes)
  assert.equal(r.pick.tracking, '1LSCXLV000VI163')
})

test('UPS SurePost: UPS number wins, USPS leg kept as other', () => {
  const codes = trackingsFrom(['1Z22FW26YN93529953', '4209217392395903097714581238496053'])
  const [r] = assignTracking(['1Z22FW2693529953'], codes) // model dropped two characters
  assert.equal(r.pick.tracking, '1Z22FW26YN93529953')
  assert.deepEqual(r.others.map((c) => c.tracking), ['92395903097714581238496053'])
  const [usps] = assignTracking(['9239 5903 0977 1458 1238 4960 53'], codes) // model read the USPS DELIVER TO block
  assert.equal(usps.pick.tracking, '1Z22FW26YN93529953')
  assert.deepEqual(usps.others.map((c) => c.tracking), ['92395903097714581238496053'])
  const [blind] = assignTracking([null], codes) // model saw no number: UPS first
  assert.equal(blind.pick.tracking, '1Z22FW26YN93529953')
})

test('two boxes in one photo: the hidden one never inherits the visible one\'s number', () => {
  const codes = trackingsFrom(['1Z07F8A70396079847', '42092173'])
  const r = assignTracking([null, '1Z07F8A70396079847'], codes) // hidden FedEx label listed first
  assert.equal(r[1].pick.tracking, '1Z07F8A70396079847')
  assert.equal(r[0].pick, null)
})

test('no barcodes: nothing picked', () => {
  assert.deepEqual(assignTracking(['1Z07F8A70396079847'], []), [{ pick: null, others: [] }])
})

test('readDistance', () => {
  assert.equal(readDistance('1Z 027 21A 03 2208 8531', '1Z02721A0322088531'), 0)
  assert.equal(readDistance(null, 'X'), 1)
})

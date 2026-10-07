import { readBarcodes, prepareZXingModule } from 'zxing-wasm/reader'
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url'
import { trackingsFrom } from './labelTracking'

/**
 * Browser side of label scans: one phone photo → its barcodes (decoded here, exact) + a
 * 1600 px JPEG for the name read and storage. Client only (canvas + wasm).
 *
 * Measured on the first 11 warehouse photos (2026-10-07): decoding at the photo's own size
 * finds the tracking barcode on 10/11; shrinking first loses them (1600 px: 5/11). The rest
 * need a 1.5× pass (small label in a whole-box shot). A label whose only number is USPS also
 * gets the 1.5× pass: UPS SurePost labels carry a UPS number that the first pass can miss.
 */

let prepared = false
function prepare() {
  if (prepared) return
  prepared = true
  // serve the wasm from our own build, not the library's default CDN
  prepareZXingModule({ overrides: { locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path) } })
}

// iOS Safari refuses canvases over ~16.7 MP; stay under it.
const MAX_PIXELS = 16_000_000

function pixels(bmp: ImageBitmap, scale: number): ImageData {
  const s = Math.min(scale, Math.sqrt(MAX_PIXELS / (bmp.width * bmp.height)))
  const w = Math.round(bmp.width * s)
  const h = Math.round(bmp.height * s)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(bmp, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h)
  canvas.width = canvas.height = 0 // free the backing store now (Safari holds it otherwise)
  return data
}

async function decode(bmp: ImageBitmap): Promise<string[]> {
  prepare()
  let raw: string[] = []
  for (const scale of [1, 1.5]) {
    const found = await readBarcodes(pixels(bmp, scale), { tryHarder: true, textMode: 'Plain', maxNumberOfSymbols: 20 })
    raw = [...new Set([...raw, ...found.map((r) => r.text)])]
    if (trackingsFrom(raw).some((c) => c.carrier !== 'usps')) break
  }
  return raw
}

/** Live camera: decode one video frame (already drawn to a canvas). Fast settings: this runs several times a second. */
export async function decodeFrame(data: ImageData): Promise<string[]> {
  prepare()
  const found = await readBarcodes(data, { tryHarder: true, textMode: 'Plain', maxNumberOfSymbols: 8 })
  return found.map((r) => r.text)
}

/** Live camera capture: the full-resolution frame → its barcodes (one more careful pass) + the 1600 px JPEG. */
export async function captureFrame(video: HTMLVideoElement): Promise<{ barcodes: string[]; image: Blob }> {
  const bmp = await createImageBitmap(video)
  try {
    const barcodes = await decode(bmp).catch(() => [] as string[])
    return { barcodes, image: await jpeg(bmp) }
  } finally {
    bmp.close()
  }
}

function jpeg(bmp: ImageBitmap, longSide = 1600): Promise<Blob> {
  const s = Math.min(1, longSide / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * s)
  canvas.height = Math.round(bmp.height * s)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) => canvas.toBlob((b) => {
    canvas.width = canvas.height = 0
    if (b) resolve(b); else reject(new Error('jpeg_failed'))
  }, 'image/jpeg', 0.85))
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

/** One picked photo → raw barcode texts + the small JPEG. Barcode failure never blocks the upload. */
export async function prepareLabelPhoto(file: File): Promise<{ barcodes: string[]; image: Blob }> {
  const bmp = await createImageBitmap(file) // applies the photo's EXIF rotation
  try {
    const barcodes = await decode(bmp).catch(() => [] as string[])
    return { barcodes, image: await jpeg(bmp) }
  } finally {
    bmp.close()
  }
}

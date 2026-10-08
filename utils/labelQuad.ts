/**
 * Live label check for the camera scanner: is a label in view, is it close enough that the
 * text is big, and is it sharp — so the scanner can take the photo by itself.
 *
 * It finds the label by its PRINTING, not its outline. Printing = thin dark strokes on a
 * lighter ground (a morphological black-hat), and a shipping label is the densest block of
 * it in view. That works where tracing the label's edges failed (2026-10-08): a white label
 * on a white bag, a yellow sticker over the edge, box art next to the label, warm dim
 * warehouse light. And it fits how the photo should be taken — UP CLOSE, label filling the
 * screen, edges allowed to run off it (Alex's reference shots, ~/Downloads/label-test).
 *
 * Tuned 2026-10-08 on 93 real photos (480 px analysis frames, ~9 ms/frame on a Mac):
 * in Alex's 23 close-up reference shots the printing spans ≥ 66% of the screen (farther
 * shots 51–65%) with sharpness 2,100–13,000; the blurry warehouse shots score < ~1,400. Whether the photo is actually
 * readable is still judged by the AI after capture (and a retake is asked for if not).
 *
 * A LABEL, not just text: "printed and sharp" alone also fired on cardboard art, bags and
 * anything with writing whenever Mau paused (2026-10-08). Every shipping label carries big
 * barcodes — blocks of parallel high-contrast bars, which almost nothing else in the
 * warehouse has — so a barcode-shaped block must be in view too (`barcode`). Measured on
 * the same photos: every close-up ≥ 2.5% of the frame; 43 of 56 label-free warehouse
 * patches ~0%, and the few that scored were pieces of real labels.
 *
 * OpenCV.js does the image work (loaded once from jsDelivr, ~3.5 MB, cached a year).
 */

const CV_URL = 'https://cdn.jsdelivr.net/npm/@techstark/opencv-js@5.0.0-release.1/dist/opencv.js'

export type Pt = { x: number; y: number }
export type LabelFind = {
  span: number // how much of the screen the printing spans (its larger side / the screen's) — how close
  center: Pt // centre of the printed block (frame pixels) — for "is the hand still"
  sharp: number // variance of the Laplacian over the printed block
  barcode: number // biggest barcode-shaped block / frame area — 0 when there is none
}

let loading: Promise<any> | null = null

/** OpenCV.js, loaded once per page. Resolves to the `cv` namespace. */
export function loadCv(): Promise<any> {
  if (loading) return loading
  loading = new Promise((resolve, reject) => {
    const ready = async () => {
      let cv = (window as any).cv
      if (cv instanceof Promise) cv = await cv
      if (cv?.Mat) return resolve(cv)
      cv.onRuntimeInitialized = () => resolve(cv)
    }
    if ((window as any).cv) return void ready()
    const s = document.createElement('script')
    s.src = CV_URL
    s.async = true
    s.onload = () => void ready()
    s.onerror = () => { loading = null; reject(new Error('opencv_load_failed')) }
    document.head.appendChild(s)
  })
  return loading
}

/** Variance of the Laplacian inside the box (clamped to the frame) — high = sharp text. */
function sharpness(cv: any, gray: any, box: { x: number; y: number; w: number; h: number }) {
  const x = Math.max(0, Math.floor(box.x)), y = Math.max(0, Math.floor(box.y))
  const w = Math.min(gray.cols, Math.ceil(box.x + box.w)) - x, h = Math.min(gray.rows, Math.ceil(box.y + box.h)) - y
  if (w < 8 || h < 8) return 0
  const roi = gray.roi(new cv.Rect(x, y, w, h)), lap = new cv.Mat(), mean = new cv.Mat(), sd = new cv.Mat()
  cv.Laplacian(roi, lap, cv.CV_64F)
  cv.meanStdDev(lap, mean, sd)
  const v = sd.data64F[0] ** 2
  roi.delete(); lap.delete(); mean.delete(); sd.delete()
  return v
}

/** Biggest block of parallel high-contrast bars (a barcode — readable or not), as a share
 * of the frame. Gradient strong ACROSS one axis and weak along the other, in both
 * orientations (labels are often sideways); merged into blocks; must be well filled. */
function barcodeShare(cv: any, gray: any) {
  const W = gray.cols, H = gray.rows
  const gx = new cv.Mat(), gy = new cv.Mat(), ax = new cv.Mat(), ay = new cv.Mat(), d = new cv.Mat(), b = new cv.Mat(), m = new cv.Mat()
  const contours = new cv.MatVector(), hier = new cv.Mat()
  const k3 = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5))
  let best = 0
  try {
    cv.Sobel(gray, gx, cv.CV_32F, 1, 0, 3)
    cv.Sobel(gray, gy, cv.CV_32F, 0, 1, 3)
    cv.convertScaleAbs(gx, ax)
    cv.convertScaleAbs(gy, ay)
    for (const [p, q, kw, kh] of [[ax, ay, 15, 5], [ay, ax, 5, 15]]) {
      cv.subtract(p, q, d) // saturates at 0: keeps only gradient mostly across one axis
      cv.blur(d, b, new cv.Size(7, 7))
      cv.threshold(b, m, 90, 255, cv.THRESH_BINARY)
      const k = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(kw, kh))
      cv.morphologyEx(m, m, cv.MORPH_CLOSE, k)
      k.delete()
      cv.erode(m, m, k3, new cv.Point(-1, -1), 2)
      cv.dilate(m, m, k3, new cv.Point(-1, -1), 2)
      cv.findContours(m, contours, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
      for (let i = 0; i < contours.size(); i++) {
        const c = contours.get(i)
        const r = cv.minAreaRect(c)
        const area = r.size.width * r.size.height
        if (area > 0 && cv.contourArea(c) / area > 0.6) best = Math.max(best, area / (W * H))
        c.delete()
      }
    }
  } finally {
    ;[gx, gy, ax, ay, d, b, m, contours, hier, k3].forEach((x) => x.delete())
  }
  return best
}

/**
 * The label in one frame (~480 px long side), or null when nothing printed is in view.
 * `view` is the part of the frame Mau actually sees (the video is object-cover cropped).
 */
export function findLabel(cv: any, frame: ImageData, view = { x: 0, y: 0, w: frame.width, h: frame.height }): LabelFind | null {
  const W = frame.width, H = frame.height
  const src = cv.matFromImageData(frame)
  const gray = new cv.Mat(), bh = new cv.Mat(), ink = new cv.Mat(), dens = new cv.Mat(), blob = new cv.Mat()
  const contours = new cv.MatVector(), hier = new cv.Mat()
  const k5 = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5))
  const kc = Math.round(Math.max(W, H) / 18)
  const kClose = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(kc, kc))
  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
    // printing: thin dark strokes on a lighter ground, then how dense it is around each pixel
    cv.morphologyEx(gray, bh, cv.MORPH_BLACKHAT, k5)
    cv.threshold(bh, ink, 35, 255, cv.THRESH_BINARY)
    const win = Math.round(Math.max(W, H) / 20)
    cv.boxFilter(ink, dens, -1, new cv.Size(win, win))
    const peak = cv.minMaxLoc(dens).maxVal
    if (peak < 40) return null // nothing printed in view
    // the label = the blob holding the most printing (text lines merged into one block)
    cv.threshold(dens, blob, Math.max(20, peak * 0.25), 255, cv.THRESH_BINARY)
    cv.morphologyEx(blob, blob, cv.MORPH_CLOSE, kClose)
    cv.findContours(blob, contours, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
    let best: { box: { x: number; y: number; w: number; h: number }; c: Pt } | null = null
    let bestMass = 0
    for (let i = 0; i < contours.size(); i++) {
      const c = contours.get(i)
      const area = cv.contourArea(c)
      if (area >= 0.02 * W * H) {
        const mask = cv.Mat.zeros(H, W, cv.CV_8UC1), mv = new cv.MatVector()
        mv.push_back(c)
        cv.drawContours(mask, mv, 0, new cv.Scalar(255), -1)
        const mass = cv.mean(dens, mask)[0] * area
        mask.delete(); mv.delete()
        if (mass > bestMass) {
          bestMass = mass
          const r = cv.boundingRect(c)
          best = { box: { x: r.x, y: r.y, w: r.width, h: r.height }, c: { x: r.x + r.width / 2, y: r.y + r.height / 2 } }
        }
      }
      c.delete()
    }
    if (!best) return null
    return {
      span: Math.max(best.box.w / view.w, best.box.h / view.h),
      center: best.c,
      sharp: sharpness(cv, gray, best.box),
      barcode: barcodeShare(cv, gray),
    }
  } finally {
    src.delete(); gray.delete(); bh.delete(); ink.delete(); dens.delete(); blob.delete()
    contours.delete(); hier.delete(); k5.delete(); kClose.delete()
  }
}

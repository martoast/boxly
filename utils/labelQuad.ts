/**
 * Live label finder for the camera scanner (like the iPhone Notes document scan): find the
 * shipping label's outline in a video frame and measure whether the phone is square to it,
 * close enough, and in focus — so the scanner can take the photo by itself.
 *
 * OpenCV.js does the image work (loaded once from jsDelivr, ~3.5 MB, cached a year).
 * Three candidate masks, because no single one works on every box: edges (a label's
 * border against the box), brightness (Otsu), and paper colour (bright AND unsaturated —
 * brown cardboard is bright-ish but saturated). The biggest convex, well-filled quad that
 * is paper-coloured inside and doesn't run off the visible area wins.
 *
 * Tuned 2026-10-07 on the day's 54 real warehouse photos (480 px long side, ~5 ms/frame
 * on a Mac): the blurry ones scored 54–74 on sharpness, sharp ones 85+; labels shot from
 * above came out as clear trapezoids (side ratio < 0.8) — exactly the tilt we want fixed.
 */

const CV_URL = 'https://cdn.jsdelivr.net/npm/@techstark/opencv-js@5.0.0-release.1/dist/opencv.js'

export type Pt = { x: number; y: number }
export type LabelQuad = {
  quad: Pt[] // tl, tr, br, bl (frame pixels)
  maxAngleErr: number // worst corner's distance from 90°
  sideRatio: number // shorter/longer of each opposite-side pair (1 = parallel = square to the camera)
  coverage: number // label area / frame area
  touchesEdge: boolean // runs off the visible area = cut off
  sharp: number // variance of the Laplacian over the label
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

function polyArea(q: Pt[]) {
  let s = 0
  for (let i = 0; i < q.length; i++) {
    const a = q[i], b = q[(i + 1) % q.length]
    s += a.x * b.y - b.x * a.y
  }
  return Math.abs(s) / 2
}

function order(q: Pt[]): Pt[] { // clockwise from top-left
  const cx = q.reduce((s, p) => s + p.x, 0) / 4
  const cy = q.reduce((s, p) => s + p.y, 0) / 4
  const sorted = [...q].sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx))
  const tl = sorted.reduce((k, p, i) => (p.x + p.y < sorted[k].x + sorted[k].y ? i : k), 0)
  return [...sorted.slice(tl), ...sorted.slice(0, tl)]
}

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

function measure(q: Pt[], view: { x: number; y: number; w: number; h: number }, A: number) {
  const ang = q.map((p, i) => {
    const a = q[(i + 3) % 4], b = q[(i + 1) % 4]
    const v1 = { x: a.x - p.x, y: a.y - p.y }, v2 = { x: b.x - p.x, y: b.y - p.y }
    return (Math.acos((v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y))) * 180) / Math.PI
  })
  const s = [dist(q[0], q[1]), dist(q[1], q[2]), dist(q[2], q[3]), dist(q[3], q[0])]
  const m = 0.012 * Math.max(view.w, view.h)
  return {
    maxAngleErr: Math.max(...ang.map((a) => Math.abs(90 - a))),
    sideRatio: Math.min(s[0] / s[2], s[2] / s[0], s[1] / s[3], s[3] / s[1]),
    coverage: polyArea(q) / A,
    touchesEdge: q.some((p) => p.x < view.x + m || p.y < view.y + m || p.x > view.x + view.w - m || p.y > view.y + view.h - m),
  }
}

function quadsFrom(cv: any, bin: any, A: number, out: Pt[][]) {
  const contours = new cv.MatVector(), hier = new cv.Mat()
  cv.findContours(bin, contours, hier, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)
  for (let i = 0; i < contours.size(); i++) {
    const c = contours.get(i)
    const area = cv.contourArea(c)
    if (area >= 0.05 * A && area <= 0.92 * A) {
      const hull = new cv.Mat()
      cv.convexHull(c, hull)
      const peri = cv.arcLength(hull, true)
      for (const e of [0.02, 0.035, 0.05]) {
        const ap = new cv.Mat()
        cv.approxPolyDP(hull, ap, e * peri, true)
        if (ap.rows === 4) {
          const q = order(Array.from({ length: 4 }, (_, j) => ({ x: ap.data32S[2 * j], y: ap.data32S[2 * j + 1] })))
          if (cv.contourArea(hull) / Math.max(1, polyArea(q)) > 0.9) out.push(q)
          ap.delete()
          break
        }
        ap.delete()
      }
      hull.delete()
    }
    c.delete()
  }
  contours.delete()
  hier.delete()
}

function sharpness(cv: any, gray: any, q: Pt[]) {
  const xs = q.map((p) => p.x), ys = q.map((p) => p.y)
  const x = Math.max(0, Math.min(...xs)), y = Math.max(0, Math.min(...ys))
  const r = new cv.Rect(x, y, Math.min(gray.cols, Math.max(...xs)) - x, Math.min(gray.rows, Math.max(...ys)) - y)
  const roi = gray.roi(r), lap = new cv.Mat(), mean = new cv.Mat(), sd = new cv.Mat()
  cv.Laplacian(roi, lap, cv.CV_64F)
  cv.meanStdDev(lap, mean, sd)
  const v = sd.data64F[0] ** 2
  roi.delete(); lap.delete(); mean.delete(); sd.delete()
  return v
}

/**
 * The label in one frame (~480 px long side), or null. `view` is the part of the frame the
 * user actually sees (the video is object-cover cropped) — a label running off it is cut off.
 */
export function findLabel(cv: any, frame: ImageData, view = { x: 0, y: 0, w: frame.width, h: frame.height }): LabelQuad | null {
  const W = frame.width, H = frame.height, A = W * H
  const src = cv.matFromImageData(frame)
  const gray = new cv.Mat(), sharpSrc = new cv.Mat(), bin = new cv.Mat(), edges = new cv.Mat(), rgb = new cv.Mat(), hsv = new cv.Mat(), paper = new cv.Mat()
  const k3 = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3))
  const k9 = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(9, 9))
  const k15 = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(15, 15))
  const cands: Pt[][] = []
  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
    gray.copyTo(sharpSrc)
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0)
    // 1. edges: the label's border against the box
    cv.Canny(gray, edges, 40, 120)
    cv.dilate(edges, edges, k3, new cv.Point(-1, -1), 2)
    quadsFrom(cv, edges, A, cands)
    // 2. brightness: the paper (Otsu), printing filled in
    cv.threshold(gray, bin, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU)
    cv.morphologyEx(bin, bin, cv.MORPH_CLOSE, k9)
    cv.morphologyEx(bin, bin, cv.MORPH_OPEN, k9)
    quadsFrom(cv, bin, A, cands)
    // 3. paper colour: bright AND unsaturated
    cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB)
    cv.cvtColor(rgb, hsv, cv.COLOR_RGB2HSV)
    const lo = new cv.Mat(H, W, cv.CV_8UC3, new cv.Scalar(0, 0, 130))
    const hi = new cv.Mat(H, W, cv.CV_8UC3, new cv.Scalar(180, 70, 255))
    cv.inRange(hsv, lo, hi, paper)
    lo.delete(); hi.delete()
    cv.morphologyEx(paper, paper, cv.MORPH_CLOSE, k15)
    cv.morphologyEx(paper, paper, cv.MORPH_OPEN, k9)
    quadsFrom(cv, paper, A, cands)

    // rank: inside the visible area first (a quad running off the screen only tells Mau to
    // back up), then the biggest; it must be paper-coloured inside
    const rank = (m: ReturnType<typeof measure>) => (m.touchesEdge ? 0 : 1) + m.coverage
    let best: { q: Pt[]; m: ReturnType<typeof measure> } | null = null
    for (const q of cands) {
      const m = measure(q, view, A)
      if (best && rank(m) <= rank(best.m)) continue
      const mask = cv.Mat.zeros(H, W, cv.CV_8UC1)
      const pts = cv.matFromArray(4, 1, cv.CV_32SC2, q.flatMap((p) => [p.x, p.y]))
      const mv = new cv.MatVector()
      mv.push_back(pts)
      cv.fillPoly(mask, mv, new cv.Scalar(255))
      const mean = cv.mean(hsv, mask) // [h, s, v]
      mask.delete(); pts.delete(); mv.delete()
      if (mean[2] < 120 || mean[1] > 90) continue // not white paper
      best = { q, m }
    }
    return best ? { quad: best.q, ...best.m, sharp: sharpness(cv, sharpSrc, best.q) } : null
  } finally {
    src.delete(); gray.delete(); sharpSrc.delete(); bin.delete(); edges.delete(); rgb.delete(); hsv.delete(); paper.delete()
    k3.delete(); k9.delete(); k15.delete()
  }
}

// HOW MUCH OF THE SCREEN THE MOBILE KEYBOARD IS COVERING.
//
// iOS Safari does not resize the layout viewport when the keyboard opens: it floats the
// keyboard over the page and SCROLLS the document to reveal the focused input. So
// window.innerHeight keeps describing the whole screen, and visualViewport is the only
// thing that reports the box the user can actually see.
//
// The part that has to be right is which numbers to subtract. `offsetTop` is how far
// Safari has scrolled the visual viewport down inside the layout viewport — it is a
// SCROLL POSITION, not a covered height. Subtracting it (as this did) shrinks the answer
// as Safari scrolls, and past a certain point the result falls under the chrome guard, the
// inset is published as 0, the container snaps back to full height and the input the user
// is typing into sits behind the keyboard (Alex, iPhone/Safari, 2026-09-15).

/** Below this, the change is the URL bar collapsing, not a keyboard. A phone keyboard is ~250-350px. */
export const CHROME_NOISE_PX = 80

export interface ViewportSample {
  /** window.innerHeight — the layout viewport, which iOS does NOT shrink for the keyboard. */
  innerHeight: number
  /** visualViewport.height — what is actually visible. */
  viewportHeight: number
}

/**
 * The height to subtract from a full-screen container so it ends where the keyboard begins.
 * Pure, so the arithmetic that broke can be held still by a test.
 */
export function keyboardInset({ innerHeight, viewportHeight }: ViewportSample): number {
  if (!Number.isFinite(innerHeight) || !Number.isFinite(viewportHeight)) return 0
  const covered = Math.round(innerHeight - viewportHeight)
  return covered > CHROME_NOISE_PX ? covered : 0
}

/** Is a keyboard open, by that same measure? */
export function keyboardOpen(sample: ViewportSample): boolean {
  return keyboardInset(sample) > 0
}

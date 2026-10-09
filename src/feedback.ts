/* Platform feedback helpers (M6). No dependencies — both the Web Animations
 * API and navigator.vibrate are built into the browser.
 *
 * Everything here is optional polish: every call is guarded so a missing API,
 * a thrown SecurityError, or a user who asked for reduced motion all degrade to
 * "nothing happens" rather than an error.
 */

function canAnimate(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** True when the user has asked the OS to reduce motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function vibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return
  try {
    navigator.vibrate(pattern)
  } catch {
    // Some browsers throw when vibration is blocked by user settings.
  }
}

/** Light tick for any tap that changes something. */
export function tapFeedback(): void {
  vibrate(10)
}

/** Sharper double-tap reserved for milestones. */
export function celebrateFeedback(): void {
  vibrate([12, 40, 12])
}

/** The checkbox overshoot on every completion. */
export function popCheckbox(element: Element): void {
  if (!canAnimate() || typeof (element as Element).animate !== 'function') return
  element.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.28)', offset: 0.4 },
      { transform: 'scale(1)' },
    ],
    { duration: 260, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  )
}

/** Expanding ring from the checkbox on every completion. */
export function ringPulse(anchor: Element): void {
  if (!canAnimate()) return
  const rect = anchor.getBoundingClientRect()
  const ring = document.createElement('span')
  ring.className = 'complete-ring'
  ring.setAttribute('aria-hidden', 'true')
  ring.style.left = `${rect.left + rect.width / 2}px`
  ring.style.top = `${rect.top + rect.height / 2}px`
  document.body.appendChild(ring)
  const done = () => ring.remove()
  ring.addEventListener('animationend', done, { once: true })
  // Backstop in case the animation never fires (e.g. tab hidden mid-flight).
  window.setTimeout(done, 900)
}
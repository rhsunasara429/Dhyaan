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

/* ---------- reminder chime (M7) ---------- */

/* Synthesised with the Web Audio API rather than shipped as an audio file:
 * no binary asset, no dependency, and it stays in step with the theme. Two
 * soft stacked tones read as a chime rather than an alarm, which matters —
 * this fires at 8 PM while someone is winding down. */

type AudioCtor = typeof AudioContext

let audioContext: AudioContext | null = null
let audioUnlocked = false

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext
  if (typeof Ctor !== 'function') return null
  try {
    audioContext ??= new Ctor()
    return audioContext
  } catch {
    return null
  }
}

/**
 * Browsers keep an AudioContext suspended until the user interacts with the
 * page, so a chime on first load would be silently dropped. Call this once
 * from a real gesture to unlock audio for the rest of the session.
 */
export function unlockAudio(): void {
  const ctx = getAudioContext()
  if (ctx === null) return
  audioUnlocked = true
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {
      // Still blocked; the chime simply stays silent.
    })
  }
}

export function playChime(): void {
  // Bail before constructing a context we would not use. Without a prior
  // gesture the context starts suspended, so this is the common case on a
  // cold load and creating one anyway only earns a console warning.
  if (!audioUnlocked) return
  const ctx = getAudioContext()
  if (ctx === null) return
  if (ctx.state !== 'running') return

  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.value = 0.0001
  master.connect(ctx.destination)
  // Short attack, long decay — a struck-bell envelope, not a beep.
  master.gain.exponentialRampToValueAtTime(0.18, now + 0.02)
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.4)

  for (const [freq, delay] of [
    [660, 0],
    [880, 0.14],
  ] as const) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, now + delay)
    gain.gain.exponentialRampToValueAtTime(0.6, now + delay + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.9)
    osc.connect(gain)
    gain.connect(master)
    osc.start(now + delay)
    osc.stop(now + delay + 1)
  }
}
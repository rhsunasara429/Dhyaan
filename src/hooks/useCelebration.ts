import { useCallback, useEffect, useRef, useState } from 'react'
import type { Celebration } from '../lib/celebration.ts'
import { celebrateFeedback, prefersReducedMotion } from '../lib/feedback.ts'

export type Burst = Celebration & {
  /** Changing id re-keys the overlay, which restarts the CSS animations. */
  id: number
  /** True when the user asked the OS to reduce motion: show the words, skip the movement. */
  reduced: boolean
}

/** Must outlast the longest particle animation (see .celebration in styles.css). */
const CLEAR_AFTER_MS = 1500

export function useCelebration() {
  const [burst, setBurst] = useState<Burst | null>(null)
  const seq = useRef(0)
  const timer = useRef<number | null>(null)

  const clear = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    setBurst(null)
  }, [])

  // Idempotent so StrictMode's mount/unmount/remount cannot strand a timer.
  useEffect(() => clear, [clear])

  const trigger = useCallback(
    (celebration: Celebration | null) => {
      if (celebration === null) return
      celebrateFeedback()
      seq.current += 1
      setBurst({
        ...celebration,
        id: seq.current,
        reduced: prefersReducedMotion(),
      })
      if (timer.current !== null) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => {
        timer.current = null
        setBurst(null)
      }, CLEAR_AFTER_MS)
    },
    [],
  )

  return { burst, trigger, clear }
}
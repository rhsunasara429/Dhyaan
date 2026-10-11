import { useRef } from 'react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import { prefersReducedMotion } from './feedback.ts'

/**
 * Horizontal swipe gesture for list rows, built on native Pointer Events.
 *
 * No gesture library (AGENTS.md keeps the dependency list empty): direction is
 * locked to horizontal so vertical page scrolling still works, the drag has
 * rubber-band resistance past the overshoot zone, and a committed swipe
 * suppresses the trailing click so a swipe never also fires a row's tap action.
 *
 * The hook owns only the drag transform on the element the handlers are spread
 * onto; what a completed swipe *means* (complete / delete) is the caller's
 * business via the onSwipeRight / onSwipeLeft callbacks.
 */

type SwipeOptions = {
  /** px past which a rightward swipe commits. */
  rightThreshold?: number
  /** px past which a leftward swipe commits. Kept larger: it is destructive. */
  leftThreshold?: number
  onSwipeRight?: () => void
  onSwipeLeft?: () => void
}

type SwipeHandlers = {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void
  onClickCapture: (event: ReactMouseEvent<HTMLElement>) => void
}

const LOCK_PX = 10 // movement before a direction is chosen
const OVERSHOOT_PX = 120 // where rubber-band resistance begins
const MAX_OFFSET_PX = 150 // hard visual clamp

export function useSwipe(options: SwipeOptions = {}): { handlers: SwipeHandlers } {
  const {
    rightThreshold = 84,
    leftThreshold = 116,
    onSwipeRight,
    onSwipeLeft,
  } = options

  const startX = useRef(0)
  const startY = useRef(0)
  const dragging = useRef(false)
  const horizontal = useRef(false)
  const suppressClick = useRef(false)

  function applyOffset(el: HTMLElement, dx: number): void {
    // Diminishing returns past the overshoot zone, then a hard clamp, so the
    // row never detaches from the finger no matter how far it is dragged.
    let offset = dx
    if (dx > OVERSHOOT_PX) offset = OVERSHOOT_PX + (dx - OVERSHOOT_PX) * 0.35
    else if (dx < -OVERSHOOT_PX) offset = -OVERSHOOT_PX + (dx + OVERSHOOT_PX) * 0.35
    offset = Math.max(-MAX_OFFSET_PX, Math.min(MAX_OFFSET_PX, offset))
    el.style.transition = 'none'
    el.style.transform = `translateX(${offset}px)`
  }

  function settle(el: HTMLElement): void {
    el.style.transition = prefersReducedMotion()
      ? 'none'
      : 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1)'
    el.style.transform = 'translateX(0)'
  }

  function onPointerDown(event: ReactPointerEvent<HTMLElement>): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    startX.current = event.clientX
    startY.current = event.clientY
    dragging.current = true
    horizontal.current = false
    suppressClick.current = false
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>): void {
    if (!dragging.current) return
    const dx = event.clientX - startX.current
    const dy = event.clientY - startY.current

    if (!horizontal.current) {
      if (Math.abs(dx) < LOCK_PX) return
      if (Math.abs(dx) <= Math.abs(dy)) {
        // Vertical intent wins — abandon the swipe and let the page scroll.
        dragging.current = false
        return
      }
      horizontal.current = true
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // Capture is best-effort; the gesture still works without it.
      }
    }

    applyOffset(event.currentTarget, dx)
  }

  function finish(event: ReactPointerEvent<HTMLElement>): void {
    if (!dragging.current) return
    dragging.current = false

    const el = event.currentTarget
    try {
      if (el.hasPointerCapture(event.pointerId)) {
        el.releasePointerCapture(event.pointerId)
      }
    } catch {
      // Ignore — capture may already be gone.
    }

    // A plain tap never set a transform; nothing to settle.
    if (!horizontal.current) return

    // Any real horizontal drag suppresses the trailing click, even below the
    // commit threshold, so a half-swipe doesn't also open the edit sheet.
    suppressClick.current = true

    const dx = event.clientX - startX.current
    settle(el)

    if (dx >= rightThreshold) onSwipeRight?.()
    else if (dx <= -leftThreshold) onSwipeLeft?.()
  }

  function onClickCapture(event: ReactMouseEvent<HTMLElement>): void {
    if (!suppressClick.current) return
    suppressClick.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: (event) => settle(event.currentTarget),
      onClickCapture,
    },
  }
}

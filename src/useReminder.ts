import { useCallback, useEffect, useRef, useState } from 'react'
import { todayLocal } from './dates.ts'
import { playChime } from './feedback.ts'
import { loadShownDay, saveShownDay } from './reminderStorage.ts'
import { msUntilNextReminderHour, resolveReminder } from './reminders.ts'

/** setTimeout overflows past ~24.8 days; clamp so a clock change cannot break it. */
const MAX_TIMEOUT = 2_147_483_000

/**
 * Shows the end-of-day reminder at most once per local day.
 *
 * Three triggers, because no single one is reliable:
 *  - on mount            -> catches up if the app is opened after the hour
 *  - on visibilitychange -> catches up when returning to an already-open tab
 *  - a timeout           -> covers the app sitting open until 8 PM
 *
 * A timeout alone would drift if the device sleeps, and visibility alone would
 * miss the case where the tab was left open all evening.
 */
export function useReminder(openTodayCount: number) {
  const [open, setOpen] = useState(false)
  const [openCount, setOpenCount] = useState(0)

  // undefined = not yet read from storage. Read lazily inside check() rather
  // than in an effect, otherwise the first check on mount would run before the
  // stored day is known and re-show a banner the user already dismissed.
  const shownDayRef = useRef<string | null | undefined>(undefined)
  const armedRef = useRef<number | null>(null)

  const check = useCallback(() => {
    if (shownDayRef.current === undefined) {
      shownDayRef.current = loadShownDay()
    }
    const now = new Date()
    const today = todayLocal(now)

    const decision = resolveReminder({
      now,
      openTodayCount,
      alreadyShownDay: shownDayRef.current,
      today,
    })

    if (decision.kind === 'due') {
      shownDayRef.current = today
      saveShownDay(today)
      setOpenCount(decision.openCount)
      setOpen(true)
      playChime()
      return
    }

    // Either too early, already handled today, or nothing open. Only retract
    // a visible banner when the work it referred to is genuinely finished —
    // otherwise merely switching tabs would silently drop it.
    if (openTodayCount <= 0) setOpen(false)
  }, [openTodayCount])

  const arm = useCallback(() => {
    if (armedRef.current !== null) window.clearTimeout(armedRef.current)
    armedRef.current = window.setTimeout(() => {
      armedRef.current = null
      check()
    }, Math.min(msUntilNextReminderHour(new Date()), MAX_TIMEOUT))
  }, [check])

  const dismiss = useCallback(() => setOpen(false), [])

  // On mount, and whenever the open-task count changes.
  useEffect(() => {
    check()
  }, [check])

  useEffect(() => {
    arm()
    // Idempotent so StrictMode's remount cannot strand a live timer.
    return () => {
      if (armedRef.current !== null) window.clearTimeout(armedRef.current)
      armedRef.current = null
    }
  }, [arm])

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== 'visible') return
      check()
      // Re-arm: a device that slept through the hour needs a fresh timer.
      arm()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [check, arm])

  return { open, openCount, dismiss }
}
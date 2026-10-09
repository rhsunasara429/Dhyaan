/* End-of-day reminder rules (M7).
 *
 * The web has no alarm API: nothing runs while the app is closed. So this
 * decides whether to remind *when the app happens to be running*, and catches
 * up on the next visit after the hour has passed. That limit is inherent to
 * the platform, not a shortcut — a guaranteed 8 PM alarm would need a backend
 * to push from, which AGENTS.md rules out.
 *
 * Pure: `now` is injected so tests can pin 7:59 PM against 8:00 PM.
 */

/** 8 PM, local time. */
export const REMINDER_HOUR = 20
export const REMINDER_MINUTE = 0

export type ReminderDecision =
  | { kind: 'none' }
  | { kind: 'due'; openCount: number }

export type ReminderInput = {
  now: Date
  /** Tasks due today or overdue that are still open. */
  openTodayCount: number
  /** Local day key (YYYY-MM-DD) the reminder was last shown on, or null. */
  alreadyShownDay: string | null
  /** Local day key for `now`, used to detect a day rollover. */
  today: string
}

export function isReminderHour(now: Date): boolean {
  return now.getHours() > REMINDER_HOUR || now.getHours() === REMINDER_HOUR
}

export function resolveReminder(input: ReminderInput): ReminderDecision {
  if (!isReminderHour(input.now)) return { kind: 'none' }
  // Already shown today. This also suppresses a second banner after dismiss.
  if (input.alreadyShownDay === input.today) return { kind: 'none' }
  // Nothing open: either finished, or never planned. Either way, no nagging.
  if (input.openTodayCount <= 0) return { kind: 'none' }
  return { kind: 'due', openCount: input.openTodayCount }
}

/** Copy for the banner. Kept here so wording stays testable and consistent. */
export function reminderCopy(openCount: number): { title: string; body: string } {
  return {
    title: openCount === 1 ? '1 task still open' : `${openCount} tasks still open`,
    body:
      openCount === 1
        ? 'Something due today is not done yet.'
        : `${openCount} tasks due today or earlier are not done yet.`,
  }
}

/**
 * Milliseconds until the next reminder hour. `now` is injected so the caller
 * can re-arm from a trusted clock; a timer alone would drift if the device
 * sleeps, which is why the hook also re-checks on visibility changes.
 */
export function msUntilNextReminderHour(now: Date): number {
  const next = new Date(now)
  next.setHours(REMINDER_HOUR, REMINDER_MINUTE, 0, 0)
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1)
  }
  return next.getTime() - now.getTime()
}
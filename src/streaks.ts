/* Daily completion counts (M6).
 *
 * Built on `doneAt`, added in M6. Tasks completed before this field existed
 * have `doneAt === null` and are not counted on any day — there is no honest
 * way to place them.
 */

import { addDaysLocal, dayKeyFromTimestamp } from './dates.ts'
import type { Task } from './types.ts'

/** How many tasks were completed on a given local day (YYYY-MM-DD). */
export function countCompletedOn(tasks: Task[], day: string): number {
  let count = 0
  for (const task of tasks) {
    if (task.done && task.doneAt !== null) {
      if (dayKeyFromTimestamp(task.doneAt) === day) count++
    }
  }
  return count
}

/** Consecutive-day completion streak. Counts back from today when today has
 *  a completion, otherwise from yesterday — the streak is still alive until
 *  the day ends. Tasks without doneAt (stored before M6) never count. */
export function currentStreak(tasks: Task[], today: string): number {
  const completedDays = new Set<string>()
  for (const task of tasks) {
    if (task.done && task.doneAt !== null) {
      completedDays.add(dayKeyFromTimestamp(task.doneAt))
    }
  }
  if (completedDays.size === 0) return 0

  let cursor = completedDays.has(today) ? today : addDaysLocal(today, -1)
  if (!completedDays.has(cursor)) return 0

  let streak = 0
  while (completedDays.has(cursor)) {
    streak++
    cursor = addDaysLocal(cursor, -1)
  }
  return streak
}
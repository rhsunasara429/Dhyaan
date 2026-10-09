/* Daily completion counts (M6).
 *
 * Built on `doneAt`, added in M6. Tasks completed before this field existed
 * have `doneAt === null` and are not counted on any day — there is no honest
 * way to place them.
 */

import { dayKeyFromTimestamp } from './dates.ts'
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
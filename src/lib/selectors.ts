import { dayKeyFromTimestamp } from './dates.ts'
import type { Task } from './types.ts'

/** Ranked tasks (P1, P2, ...) sort before unranked ones, in rank order.
 *  Returns -1 / 1 when exactly one side is ranked, the rank delta when both
 *  are ranked, and 0 when neither is (caller falls through to its tie-break).
 */
function comparePriorityOrder(a: Task, b: Task): number {
  const rankA = a.priorityOrder
  const rankB = b.priorityOrder
  if (rankA !== null && rankB !== null) return rankA - rankB
  if (rankA !== null) return -1
  if (rankB !== null) return 1
  return 0
}

export function selectInbox(tasks: Task[]): Task[] {
  // Inbox keeps newest-first ordering; click-rank only affects Today.
  return tasks
    .filter((task) => !task.done && task.dueDate === null)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function selectCompleted(tasks: Task[]): Task[] {
  return tasks
    .filter((task) => task.done === true)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function selectOverdue(tasks: Task[], today: string): Task[] {
  return tasks
    .filter(
      (task) =>
        !task.done && task.dueDate !== null && task.dueDate < today,
    )
    .sort((a, b) => {
      const rankOrder = comparePriorityOrder(a, b)
      if (rankOrder !== 0) return rankOrder
      const dateOrder = (a.dueDate as string).localeCompare(b.dueDate as string)
      return dateOrder !== 0 ? dateOrder : b.createdAt - a.createdAt
    })
}

export function selectDueToday(tasks: Task[], today: string): Task[] {
  return tasks
    .filter((task) => !task.done && task.dueDate === today)
    .sort((a, b) => {
      const rankOrder = comparePriorityOrder(a, b)
      if (rankOrder !== 0) return rankOrder
      return b.createdAt - a.createdAt
    })
}

export function selectUpcoming(tasks: Task[], today: string): Task[] {
  return tasks
    .filter(
      (task) =>
        !task.done && task.dueDate !== null && task.dueDate > today,
    )
    .sort((a, b) => {
      const rankOrder = comparePriorityOrder(a, b)
      if (rankOrder !== 0) return rankOrder
      const dateOrder = (a.dueDate as string).localeCompare(b.dueDate as string)
      return dateOrder !== 0 ? dateOrder : b.createdAt - a.createdAt
    })
}

export function selectDailyProgress(tasks: Task[], today: string) {
  const completedToday = tasks.filter((t) => {
    if (!t.done || t.doneAt === null) return false
    return dayKeyFromTimestamp(t.doneAt) === today
  })

  const unfinishedEligible = tasks.filter((t) => {
    if (t.done || t.dueDate === null) return false
    return t.dueDate <= today
  })

  const numerator = completedToday.length
  const denominator = numerator + unfinishedEligible.length

  return {
    numerator,
    denominator,
    percentage: denominator > 0
      ? Math.round((numerator / denominator) * 100)
      : null,
  }
}

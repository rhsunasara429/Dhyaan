import type { Task } from './types.ts'
import { dayKeyFromTimestamp } from './dates.ts'

export function selectInbox(tasks: Task[]): Task[] {
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
      const dateOrder = (a.dueDate as string).localeCompare(b.dueDate as string)
      return dateOrder !== 0 ? dateOrder : b.createdAt - a.createdAt
    })
}

export function selectDueToday(tasks: Task[], today: string): Task[] {
  return tasks
    .filter((task) => !task.done && task.dueDate === today)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function selectUpcoming(tasks: Task[], today: string): Task[] {
  return tasks
    .filter(
      (task) =>
        !task.done && task.dueDate !== null && task.dueDate > today,
    )
    .sort((a, b) => {
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

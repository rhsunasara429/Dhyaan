import type { Task } from './types.ts'

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

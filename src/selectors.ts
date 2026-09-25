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

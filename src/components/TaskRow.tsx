import type { Task } from '../types.ts'

export function TaskRow({ task }: { task: Task }) {
  return <li className="task-row">{task.title}</li>
}

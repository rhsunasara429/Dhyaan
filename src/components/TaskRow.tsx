import type { Task } from '../types.ts'

type TaskRowProps = {
  task: Task
  onToggle: (id: string) => void
  onEdit: (id: string) => void
}

export function TaskRow({ task, onToggle, onEdit }: TaskRowProps) {
  return (
    <li className={task.done ? 'task-row task-row-done' : 'task-row'}>
      <button
        type="button"
        className="task-checkbox"
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.done ? `Mark "${task.title}" as active` : `Mark "${task.title}" as complete`}
        onClick={() => onToggle(task.id)}
      >
        {task.done ? '✓' : ''}
      </button>
      <button
        type="button"
        className="task-title"
        aria-label={`Edit "${task.title}"`}
        onClick={() => onEdit(task.id)}
      >
        {task.title}
      </button>
    </li>
  )
}

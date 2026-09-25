import type { Task } from '../types.ts'

type TaskRowProps = {
  task: Task
  today: string
  onToggle: (id: string) => void
  onEdit: (id: string) => void
}

function areaLabel(area: NonNullable<Task['area']>): string {
  return area.charAt(0).toUpperCase() + area.slice(1)
}

export function TaskRow({ task, today, onToggle, onEdit }: TaskRowProps) {
  const overdue = !task.done && task.dueDate !== null && task.dueDate < today
  const meta: string[] = []
  if (task.area !== null) meta.push(areaLabel(task.area))
  if (task.dueDate !== null) meta.push(task.dueDate)

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
        <span aria-hidden="true">{task.done ? '✓' : ''}</span>
      </button>
      <button
        type="button"
        className="task-title"
        aria-label={`Edit "${task.title}"`}
        onClick={() => onEdit(task.id)}
      >
        <span className="task-title-text">{task.title}</span>
        {overdue ? <span className="task-overdue">Overdue</span> : null}
        {meta.length > 0 ? (
          <span className="task-meta">{meta.join(' · ')}</span>
        ) : null}
      </button>
    </li>
  )
}

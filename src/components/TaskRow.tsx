import { useState, useEffect } from 'react'
import type { Task } from '../types.ts'

type TaskRowProps = {
  task: Task
  today: string
  /** Receives the tapped checkbox so the caller can anchor feedback to it. */
  onToggle: (id: string, anchor: HTMLElement) => void
  onEdit: (id: string) => void
}

function areaLabel(area: NonNullable<Task['area']>): string {
  return area.charAt(0).toUpperCase() + area.slice(1)
}

export function TaskRow({ task, today, onToggle, onEdit }: TaskRowProps) {
  const [isFlashing, setIsFlashing] = useState(false)

  useEffect(() => {
    if (task.done) {
      setIsFlashing(true)
      const timer = setTimeout(() => setIsFlashing(false), 600)
      return () => clearTimeout(timer)
    }
  }, [task.done])

  const overdue = !task.done && task.dueDate !== null && task.dueDate < today
  const meta: string[] = []
  if (task.area !== null) meta.push(areaLabel(task.area))
  if (task.dueDate !== null) meta.push(task.dueDate)

  return (
    <li className={`${task.done ? 'task-row task-row-done' : 'task-row'} ${isFlashing ? 'task-row-flash' : ''}`}>
      <button
        type="button"
        className="task-checkbox"
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.done ? `Mark "${task.title}" as active` : `Mark "${task.title}" as complete`}
        onClick={(event) => onToggle(task.id, event.currentTarget)}
      >
        <span aria-hidden="true">
          {task.done ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : ''}
        </span>
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

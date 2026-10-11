import { useState, useEffect, useRef } from 'react'
import type { Task } from '../types.ts'
import { useSwipe } from '../useSwipe.ts'
import { tapFeedback, celebrateFeedback } from '../feedback.ts'

type TaskRowProps = {
  task: Task
  today: string
  /** Receives the tapped checkbox so the caller can anchor feedback to it. */
  onToggle: (id: string, anchor: HTMLElement) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

function areaLabel(area: NonNullable<Task['area']>): string {
  return area.charAt(0).toUpperCase() + area.slice(1)
}

export function TaskRow({ task, today, onToggle, onEdit, onDelete }: TaskRowProps) {
  const [isFlashing, setIsFlashing] = useState(false)
  const surfaceRef = useRef<HTMLDivElement>(null)

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

  // Right swipe completes (or re-opens) a task; left swipe deletes it. Delete
  // uses the firmer threshold and a sharper haptic so it can't happen by accident.
  const { handlers } = useSwipe({
    onSwipeRight: () => {
      tapFeedback()
      onToggle(task.id, surfaceRef.current ?? document.body)
    },
    onSwipeLeft: () => {
      celebrateFeedback()
      onDelete(task.id)
    },
  })

  return (
    <li className="task-row-wrap">
      <div className="task-row-actions" aria-hidden="true">
        <span className="task-row-action task-row-action-complete">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {task.done ? 'Reopen' : 'Complete'}
        </span>
        <span className="task-row-action task-row-action-delete">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Delete
        </span>
      </div>
      <div
        ref={surfaceRef}
        className={`${task.done ? 'task-row task-row-done' : 'task-row'} ${isFlashing ? 'task-row-flash' : ''}`}
        {...handlers}
      >
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
      </div>
    </li>
  )
}


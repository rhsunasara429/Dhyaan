import { useState, useEffect, useRef } from 'react'
import type { Task } from '../lib/types.ts'
import { useSwipe } from '../hooks/useSwipe.ts'
import { tapFeedback, celebrateFeedback } from '../lib/feedback.ts'

type TaskRowProps = {
  task: Task
  today: string
  /** Receives the tapped checkbox so the caller can anchor feedback to it. */
  onToggle: (id: string, anchor: HTMLElement) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onTogglePriority?: (id: string) => void
  /**
   * Priority lives only on Today work (Overdue + Due Today). Callers pass
   * false for Inbox / Upcoming / Completed so the star and the P-badge stay
   * hidden where priority is not allowed.
   */
  allowPriority: boolean
  /**
   * Inbox-only: right-swipe schedules the task for today instead of
   * completing it. When provided, the revealed action reads "Today".
   */
  onMoveToToday?: (id: string) => void
}

/** Collapse unlimited ranks onto three Todoist-style tiers: P1, P2, P3+. */
function priorityTier(rank: number): 'p1' | 'p2' | 'p3' {
  if (rank === 1) return 'p1'
  if (rank === 2) return 'p2'
  return 'p3'
}

function areaLabel(area: NonNullable<Task['area']>): string {
  return area.charAt(0).toUpperCase() + area.slice(1)
}

export function TaskRow({ task, today, onToggle, onEdit, onDelete, onTogglePriority, allowPriority, onMoveToToday }: TaskRowProps) {
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
  const rank = task.priorityOrder
  // A stale rank (pre-migration storage) never shows where priority is off.
  const ranked = allowPriority && rank !== null
  const tier = ranked ? priorityTier(rank as number) : null
  const repeat = task.repeat ?? null
  const meta: string[] = []
  if (task.area !== null) meta.push(areaLabel(task.area))
  if (task.dueDate !== null) meta.push(task.dueDate)

  // Right swipe completes (or re-opens) a task — except in the Inbox, where
  // onMoveToToday turns it into "schedule for today". Left swipe deletes it.
  // Delete uses the firmer threshold and a sharper haptic so it can't happen
  // by accident.
  const moveToToday = onMoveToToday !== undefined
  const { handlers } = useSwipe({
    onSwipeRight: () => {
      tapFeedback()
      if (moveToToday) {
        onMoveToToday(task.id)
      } else {
        onToggle(task.id, surfaceRef.current ?? document.body)
      }
    },
    onSwipeLeft: () => {
      celebrateFeedback()
      onDelete(task.id)
    },
  })

  return (
    <li className="task-row-wrap">
      <div className="task-row-actions" aria-hidden="true">
        {moveToToday ? (
          <span className="task-row-action task-row-action-today">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
            Today
          </span>
        ) : (
          <span className="task-row-action task-row-action-complete">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {task.done ? 'Reopen' : 'Complete'}
          </span>
        )}
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
        className={`${task.done ? 'task-row task-row-done' : 'task-row'}${ranked && tier ? ` task-row-important task-row-${tier}` : ''} ${isFlashing ? 'task-row-flash' : ''}`}
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
          {ranked && tier ? (
            <span className={`task-priority task-priority-${tier}`} aria-hidden="true">
              P{rank}
            </span>
          ) : null}
          {overdue ? <span className="task-overdue">Overdue</span> : null}
          {repeat !== null ? (
            <span className="task-repeat" title={repeat === 'daily' ? 'Repeats daily' : 'Repeats weekly'}>
              ↻ {repeat === 'daily' ? 'Daily' : 'Weekly'}
            </span>
          ) : null}
          {meta.length > 0 ? (
            <span className="task-meta">{meta.join(' · ')}</span>
          ) : null}
        </button>
        {allowPriority ? (
          <button
            type="button"
            className={
              ranked && tier
                ? `priority-toggle priority-toggle-active priority-toggle-${tier}`
                : 'priority-toggle'
            }
            aria-pressed={ranked}
            aria-label={
              ranked
                ? `Clear priority P${rank} from "${task.title}"`
                : `Set "${task.title}" as priority`
            }
            title={ranked ? `P${rank} — select to clear` : 'Set priority rank'}
            onClick={(event) => {
              event.stopPropagation()
              onTogglePriority?.(task.id)
            }}
            onKeyDown={(event) => {
              event.stopPropagation()
            }}
          >
            {ranked && tier ? (
              <span className={`priority-rank priority-rank-${tier}`} aria-hidden="true">
                P{rank}
              </span>
            ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            )}
          </button>
        ) : null}
      </div>
    </li>
  )
}

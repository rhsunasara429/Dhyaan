import { useRef } from 'react'
import type { Note } from '../types.ts'
import { useSwipe } from '../useSwipe.ts'
import { celebrateFeedback } from '../feedback.ts'

type NoteRowProps = {
  note: Note
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function NoteRow({ note, onEdit, onDelete }: NoteRowProps) {
  const created = new Date(note.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const surfaceRef = useRef<HTMLDivElement>(null)

  // Notes have no "complete" state, so the only swipe is left-to-delete.
  const { handlers } = useSwipe({
    onSwipeLeft: () => {
      celebrateFeedback()
      onDelete(note.id)
    },
  })

  return (
    <li className="note-row-wrap">
      <div className="task-row-actions" aria-hidden="true">
        <span className="task-row-action task-row-action-delete">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Delete
        </span>
      </div>
      <div ref={surfaceRef} className="note-row" {...handlers}>
        <button
          type="button"
          className="note-body"
          aria-label={`Edit note: ${note.content.slice(0, 80)}`}
          onClick={() => onEdit(note.id)}
        >
          <span className="note-content">{note.content}</span>
          <span className="note-meta">{created}</span>
        </button>
      </div>
    </li>
  )
}


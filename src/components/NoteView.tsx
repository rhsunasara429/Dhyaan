import { useEffect, useRef } from 'react'
import type { Note } from '../lib/types.ts'
import { noteTitle } from '../lib/notes.ts'

type NoteViewProps = {
  note: Note
  onEdit: (id: string) => void
  onClose: () => void
}

export function NoteView({ note, onEdit, onClose }: NoteViewProps) {
  const title = noteTitle(note.content)
  const created = new Date(note.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <div
      ref={panelRef}
      className="note-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={`Note: ${title}`}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <div className="note-viewer-panel">
        <header className="note-viewer-header">
          <button
            type="button"
            className="note-viewer-icon"
            aria-label="Back to notes"
            onClick={onClose}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h2 className="note-viewer-title">{title}</h2>
          <button
            type="button"
            className="note-viewer-icon"
            aria-label="Edit note"
            onClick={() => onEdit(note.id)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
        </header>
        <div className="note-viewer-body">
          <p className="note-viewer-date">{created}</p>
          <p className="note-viewer-content">{note.content}</p>
        </div>
      </div>
    </div>
  )
}

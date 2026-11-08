import { useEffect, useRef, useState } from 'react'
import type { Note } from '../lib/types.ts'

type NoteEditSheetProps = {
  note: Note
  onSave: (id: string, content: string) => boolean
  onDelete: (id: string) => void
  onClose: () => void
}

export function NoteEditSheet({
  note,
  onSave,
  onDelete,
  onClose,
}: NoteEditSheetProps) {
  const [content, setContent] = useState(note.content)
  const [showHint, setShowHint] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function submit() {
    if (confirmingDelete) return
    if (content.trim() === note.content) {
      onClose()
      return
    }
    const ok = onSave(note.id, content)
    if (ok) {
      onClose()
    } else {
      setShowHint(true)
    }
  }

  function confirmDelete() {
    onDelete(note.id)
    onClose()
  }

  return (
    <form
      className="note-editor"
      role="dialog"
      aria-modal="true"
      aria-label="Edit note"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return
        if (confirmingDelete) {
          setConfirmingDelete(false)
        } else {
          onClose()
        }
      }}
    >
      <div className="note-editor-panel">
        <header className="note-editor-header">
          <button
            type="button"
            className="note-viewer-icon"
            aria-label="Cancel editing"
            onClick={onClose}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h2 className="note-editor-heading">Edit note</h2>
          <button
            type="submit"
            className="note-editor-save"
            disabled={confirmingDelete}
          >
            Save
          </button>
        </header>
        {confirmingDelete ? (
          <div className="note-editor-confirm">
            <p className="sheet-confirm-text">
              Delete this note? This cannot be undone.
            </p>
            <div className="sheet-actions">
              <button
                type="button"
                className="sheet-cancel"
                onClick={() => setConfirmingDelete(false)}
              >
                Keep
              </button>
              <button
                type="button"
                className="sheet-delete"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="note-editor-body">
            <textarea
              ref={inputRef}
              className="note-editor-textarea"
              aria-label="Note content"
              autoComplete="off"
              value={content}
              onChange={(event) => {
                setContent(event.target.value)
                setShowHint(false)
              }}
            />
            {showHint ? (
              <p className="sheet-hint" role="alert">
                Type a note first.
              </p>
            ) : null}
            <button
              type="button"
              className="sheet-delete-zone note-editor-delete"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete note
            </button>
          </div>
        )}
      </div>
    </form>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { Note } from '../types.ts'

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
    <div
      className="sheet-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="sheet"
        role="dialog"
        aria-label="Edit note"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose()
        }}
      >
        {confirmingDelete ? (
          <div>
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
          <form
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            <textarea
              ref={inputRef}
              className="sheet-textarea"
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
            <div className="sheet-actions">
              <button type="button" className="sheet-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="sheet-save">
                Save
              </button>
            </div>
            <button
              type="button"
              className="sheet-delete-zone"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete note
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { Task } from '../types.ts'

type EditSheetProps = {
  task: Task
  onSave: (id: string, title: string) => boolean
  onDelete: (id: string) => void
  onClose: () => void
}

export function EditSheet({ task, onSave, onDelete, onClose }: EditSheetProps) {
  const [title, setTitle] = useState(task.title)
  const [showHint, setShowHint] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function submit() {
    if (title.trim() === task.title) {
      onClose()
      return
    }
    const ok = onSave(task.id, title)
    if (ok) {
      onClose()
    } else {
      setShowHint(true)
    }
  }

  function confirmDelete() {
    onDelete(task.id)
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
        aria-label="Edit task"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose()
        }}
      >
        {confirmingDelete ? (
          <div>
            <p className="sheet-confirm-text">
              Delete “{task.title}”? This cannot be undone.
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
            <input
              ref={inputRef}
              className="sheet-input"
              type="text"
              aria-label="Task title"
              autoComplete="off"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                setShowHint(false)
              }}
            />
            {showHint ? (
              <p className="sheet-hint" role="alert">
                Type a task title first.
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
              Delete task
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

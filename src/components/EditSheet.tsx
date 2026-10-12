import { useEffect, useRef, useState } from 'react'
import type { Task } from '../lib/types.ts'
import { OrganizeFields } from './OrganizeFields.tsx'

export type EditInput = {
  title: string
  area: Task['area']
  dueDate: Task['dueDate']
}

type EditSheetProps = {
  task: Task
  onSave: (id: string, patch: EditInput) => boolean
  onDelete: (id: string) => void
  onClose: () => void
}

export function EditSheet({ task, onSave, onDelete, onClose }: EditSheetProps) {
  const [title, setTitle] = useState(task.title)
  const [area, setArea] = useState<Task['area']>(task.area)
  const [dueDate, setDueDate] = useState<Task['dueDate']>(task.dueDate)
  const [showHint, setShowHint] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function submit() {
    if (
      title.trim() === task.title &&
      area === task.area &&
      dueDate === task.dueDate
    ) {
      onClose()
      return
    }
    const ok = onSave(task.id, { title, area, dueDate })
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
            <OrganizeFields
              area={area}
              dueDate={dueDate}
              onAreaChange={setArea}
              onDueDateChange={setDueDate}
            />
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

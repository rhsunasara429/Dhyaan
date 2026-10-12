import { useEffect, useRef, useState } from 'react'
import type { Task } from '../lib/types.ts'
import { OrganizeFields } from './OrganizeFields.tsx'

type CaptureSheetProps = {
  onSave: (
    title: string,
    init: { area: Task['area']; dueDate: Task['dueDate'] },
  ) => boolean
  onClose: () => void
}

export function CaptureSheet({ onSave, onClose }: CaptureSheetProps) {
  const [title, setTitle] = useState('')
  const [area, setArea] = useState<Task['area']>(null)
  const [dueDate, setDueDate] = useState<Task['dueDate']>(null)
  const [showHint, setShowHint] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function submit() {
    const ok = onSave(title, { area, dueDate })
    if (ok) {
      setTitle('')
      setArea(null)
      setDueDate(null)
      setShowHint(false)
      onClose()
    } else {
      setShowHint(true)
    }
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
        aria-label="Capture task"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose()
        }}
      >
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
            placeholder="What do you need to remember?"
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
        </form>
      </div>
    </div>
  )
}

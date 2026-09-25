import { useEffect, useRef, useState } from 'react'

type CaptureSheetProps = {
  onSave: (title: string) => boolean
  onClose: () => void
}

export function CaptureSheet({ onSave, onClose }: CaptureSheetProps) {
  const [title, setTitle] = useState('')
  const [showHint, setShowHint] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function submit() {
    const ok = onSave(title)
    if (ok) {
      setTitle('')
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

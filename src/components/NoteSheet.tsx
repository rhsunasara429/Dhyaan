import { useEffect, useRef, useState } from 'react'

type NoteSheetProps = {
  onSave: (content: string) => boolean
  onClose: () => void
}

export function NoteSheet({ onSave, onClose }: NoteSheetProps) {
  const [content, setContent] = useState('')
  const [showHint, setShowHint] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function submit() {
    const ok = onSave(content)
    if (ok) {
      setContent('')
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
        aria-label="Capture note"
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
          <textarea
            ref={inputRef}
            className="sheet-textarea"
            placeholder="Jot something down…"
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
        </form>
      </div>
    </div>
  )
}

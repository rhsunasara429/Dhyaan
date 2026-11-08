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
    <form
      className="note-editor"
      role="dialog"
      aria-modal="true"
      aria-label="Capture note"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <div className="note-editor-panel">
        <header className="note-editor-header">
          <button
            type="button"
            className="note-viewer-icon"
            aria-label="Cancel"
            onClick={onClose}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h2 className="note-editor-heading">New note</h2>
          <button type="submit" className="note-editor-save">
            Save
          </button>
        </header>
        <div className="note-editor-body">
          <textarea
            ref={inputRef}
            className="note-editor-textarea"
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
        </div>
      </div>
    </form>
  )
}

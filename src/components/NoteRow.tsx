import type { Note } from '../types.ts'

type NoteRowProps = {
  note: Note
  onEdit: (id: string) => void
}

export function NoteRow({ note, onEdit }: NoteRowProps) {
  const created = new Date(note.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <li className="note-row">
      <button
        type="button"
        className="note-body"
        aria-label={`Edit note: ${note.content.slice(0, 80)}`}
        onClick={() => onEdit(note.id)}
      >
        <span className="note-content">{note.content}</span>
        <span className="note-meta">{created}</span>
      </button>
    </li>
  )
}

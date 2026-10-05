import type { Note } from './types.ts'

export function isNote(value: unknown): value is Note {
  if (typeof value !== 'object' || value === null) return false
  const n = value as Record<string, unknown>
  return (
    typeof n.id === 'string' &&
    n.id.length > 0 &&
    typeof n.content === 'string' &&
    n.content.length > 0 &&
    n.content.trim().length > 0 &&
    typeof n.createdAt === 'number' &&
    Number.isFinite(n.createdAt) &&
    typeof n.updatedAt === 'number' &&
    Number.isFinite(n.updatedAt)
  )
}

export function buildNote(content: unknown): Note | null {
  if (typeof content !== 'string') return null
  const trimmed = content.trim()
  if (trimmed.length === 0) return null
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    content: trimmed,
    createdAt: now,
    updatedAt: now,
  }
}

export function updateNote(
  notes: Note[],
  id: string,
  content: unknown,
): Note[] | null {
  if (typeof content !== 'string') return null
  const trimmed = content.trim()
  if (trimmed.length === 0) return null
  let found = false
  const next = notes.map((note) => {
    if (note.id !== id) return note
    found = true
    return { ...note, content: trimmed, updatedAt: Date.now() }
  })
  return found ? next : null
}

export function deleteNote(notes: Note[], id: string): Note[] {
  return notes.filter((note) => note.id !== id)
}

export function selectNotesNewestFirst(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => b.createdAt - a.createdAt)
}

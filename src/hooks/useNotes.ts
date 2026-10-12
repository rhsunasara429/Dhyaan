import { useRef, useState } from 'react'
import { loadNotes, saveNotes } from '../lib/noteStorage.ts'
import { buildNote, deleteNote, updateNote } from '../lib/notes.ts'
import type { Note } from '../lib/types.ts'

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes())
  const notesRef = useRef(notes)

  function commit(next: Note[]): void {
    notesRef.current = next
    setNotes(next)
    saveNotes(next)
  }

  function addNote(content: string): boolean {
    const note = buildNote(content)
    if (note === null) return false
    commit([note, ...notesRef.current])
    return true
  }

  function updateNoteById(id: string, content: string): boolean {
    const next = updateNote(notesRef.current, id, content)
    if (next === null) return false
    commit(next)
    return true
  }

  function deleteNoteById(id: string): boolean {
    const current = notesRef.current
    if (!current.some((note) => note.id === id)) return false
    commit(deleteNote(current, id))
    return true
  }

  return {
    notes,
    addNote,
    updateNoteById,
    deleteNoteById,
  }
}

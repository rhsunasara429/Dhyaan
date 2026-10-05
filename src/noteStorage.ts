import { isNote } from './notes.ts'
import type { Note } from './types.ts'

export const NOTES_STORAGE_KEY = 'dhyaan.notes.v1'

export type NoteStore = Pick<Storage, 'getItem' | 'setItem'>

function defaultStore(): NoteStore | null {
  try {
    if (typeof globalThis.localStorage !== 'undefined') {
      return globalThis.localStorage
    }
    return null
  } catch {
    return null
  }
}

export function loadNotes(store: NoteStore | null = defaultStore()): Note[] {
  if (store === null) return []
  let raw: string | null
  try {
    raw = store.getItem(NOTES_STORAGE_KEY)
  } catch {
    return []
  }
  if (raw === null || raw === '') return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  return parsed.filter(isNote)
}

export function saveNotes(
  notes: Note[],
  store: NoteStore | null = defaultStore(),
): void {
  if (store === null) return
  try {
    store.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes))
  } catch {
    return
  }
}

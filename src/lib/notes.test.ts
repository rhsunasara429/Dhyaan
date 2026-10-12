import { describe, expect, it } from 'vitest'
import {
  buildNote,
  deleteNote,
  isNote,
  selectNotesNewestFirst,
  updateNote,
} from './notes.ts'
import type { Note } from './types.ts'

function makeNote(id: string, overrides: Partial<Note> = {}): Note {
  return {
    id,
    content: `note ${id}`,
    createdAt: 100,
    updatedAt: 100,
    ...overrides,
  }
}

describe('buildNote', () => {
  it('creates a valid note', () => {
    const note = buildNote('professor said chapter 4')
    expect(note).not.toBeNull()
    expect(typeof note?.id).toBe('string')
    expect(note?.id.length).toBeGreaterThan(0)
    expect(note?.content).toBe('professor said chapter 4')
    expect(typeof note?.createdAt).toBe('number')
  })

  it('sets updatedAt equal to createdAt on creation', () => {
    const note = buildNote('hello')
    expect(note?.updatedAt).toBe(note?.createdAt)
  })

  it('trims outer whitespace but preserves internal spaces and newlines', () => {
    expect(buildNote('  hello   world  ')?.content).toBe('hello   world')
    expect(buildNote('  line one\nline two  ')?.content).toBe(
      'line one\nline two',
    )
  })

  it('rejects empty and whitespace-only content', () => {
    expect(buildNote('')).toBeNull()
    expect(buildNote('   ')).toBeNull()
    expect(buildNote('\n\t ')).toBeNull()
  })

  it('rejects non-string input', () => {
    expect(buildNote(null)).toBeNull()
    expect(buildNote(undefined)).toBeNull()
    expect(buildNote(42)).toBeNull()
  })

  it('generates unique IDs', () => {
    const a = buildNote('one')
    const b = buildNote('two')
    expect(a?.id).not.toBe(b?.id)
  })
})

describe('selectNotesNewestFirst', () => {
  it('orders by createdAt descending', () => {
    const oldNote = makeNote('old', { createdAt: 100, updatedAt: 100 })
    const newNote = makeNote('new', { createdAt: 300, updatedAt: 300 })
    const midNote = makeNote('mid', { createdAt: 200, updatedAt: 200 })
    expect(
      selectNotesNewestFirst([oldNote, newNote, midNote]).map((n) => n.id),
    ).toEqual(['new', 'mid', 'old'])
  })

  it('does not mutate the input array', () => {
    const notes = [makeNote('a', { createdAt: 1 }), makeNote('b', { createdAt: 2 })]
    const snapshot = [...notes]
    selectNotesNewestFirst(notes)
    expect(notes).toEqual(snapshot)
  })
})

describe('updateNote', () => {
  it('updates content and bumps updatedAt while preserving id and createdAt', () => {
    const note = makeNote('a', { createdAt: 7, updatedAt: 7 })
    const next = updateNote([note], 'a', '  edited  ')
    expect(next?.[0]?.content).toBe('edited')
    expect(next?.[0]?.id).toBe('a')
    expect(next?.[0]?.createdAt).toBe(7)
    expect((next?.[0]?.updatedAt ?? 0) >= 7).toBe(true)
  })

  it('rejects empty and whitespace-only content', () => {
    const notes = [makeNote('a')]
    expect(updateNote(notes, 'a', '')).toBeNull()
    expect(updateNote(notes, 'a', '   ')).toBeNull()
  })

  it('returns null for an unknown id', () => {
    expect(updateNote([makeNote('a')], 'missing', 'ok')).toBeNull()
  })

  it('leaves other notes untouched', () => {
    const other = makeNote('b')
    const next = updateNote([makeNote('a'), other], 'a', 'renamed')
    expect(next?.[1]).toBe(other)
  })

  it('does not mutate the input', () => {
    const notes = [makeNote('a')]
    const snapshot = structuredClone(notes)
    updateNote(notes, 'a', 'new content')
    expect(notes).toEqual(snapshot)
  })
})

describe('deleteNote', () => {
  it('removes exactly the matching note', () => {
    const notes = [makeNote('a'), makeNote('b'), makeNote('c')]
    const next = deleteNote(notes, 'b')
    expect(next.map((n) => n.id)).toEqual(['a', 'c'])
  })

  it('preserves the remaining note objects', () => {
    const keep = makeNote('a')
    const next = deleteNote([keep, makeNote('b')], 'b')
    expect(next).toEqual([keep])
    expect(next[0]).toBe(keep)
  })

  it('does not mutate the original array', () => {
    const notes = [makeNote('a'), makeNote('b')]
    deleteNote(notes, 'a')
    expect(notes).toHaveLength(2)
  })

  it('leaves the collection unchanged for an unknown id', () => {
    const notes = [makeNote('a')]
    expect(deleteNote(notes, 'missing')).toEqual(notes)
  })
})

describe('isNote', () => {
  it('accepts a valid note', () => {
    expect(isNote(makeNote('a'))).toBe(true)
  })

  it('rejects invalid shapes', () => {
    expect(isNote(null)).toBe(false)
    expect(isNote({ ...makeNote('a'), id: '' })).toBe(false)
    expect(isNote({ ...makeNote('a'), content: '' })).toBe(false)
    expect(isNote({ ...makeNote('a'), content: '   ' })).toBe(false)
    expect(isNote({ ...makeNote('a'), createdAt: NaN })).toBe(false)
    expect(isNote({ ...makeNote('a'), updatedAt: 'x' })).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import {
  loadNotes,
  NOTES_STORAGE_KEY,
  saveNotes,
  type NoteStore,
} from './noteStorage.ts'
import { STORAGE_KEY } from './storage.ts'
import type { Note } from './types.ts'

function fakeStore(seed: Record<string, string> = {}) {
  const data = new Map<string, string>(Object.entries(seed))
  const store: NoteStore = {
    getItem: (key: string) => (data.has(key) ? data.get(key) ?? null : null),
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
  }
  return {
    store,
    raw: (key: string = NOTES_STORAGE_KEY) =>
      data.has(key) ? data.get(key) : undefined,
  }
}

function makeNote(id: string): Note {
  return {
    id,
    content: `note ${id}`,
    createdAt: 1,
    updatedAt: 1,
  }
}

describe('note storage', () => {
  it('round-trips valid notes', () => {
    const { store } = fakeStore()
    const notes = [makeNote('a'), makeNote('b')]
    saveNotes(notes, store)
    expect(loadNotes(store)).toEqual(notes)
  })

  it('returns empty for empty storage', () => {
    const { store } = fakeStore()
    expect(loadNotes(store)).toEqual([])
  })

  it('does not crash on malformed JSON and preserves the value', () => {
    const { store, raw } = fakeStore({ [NOTES_STORAGE_KEY]: '{not-json' })
    expect(loadNotes(store)).toEqual([])
    expect(raw()).toBe('{not-json')
  })

  it('does not crash on invalid top-level structure and preserves the value', () => {
    const { store, raw } = fakeStore({ [NOTES_STORAGE_KEY]: '{"a":1}' })
    expect(loadNotes(store)).toEqual([])
    expect(raw()).toBe('{"a":1}')
  })

  it('keeps valid entries and discards invalid note shapes', () => {
    const { store } = fakeStore({
      [NOTES_STORAGE_KEY]: JSON.stringify([
        makeNote('good'),
        { id: 'bad', content: '' },
        'junk',
      ]),
    })
    expect(loadNotes(store)).toEqual([makeNote('good')])
  })

  it('lets a later valid mutation overwrite previously corrupt storage', () => {
    const { store, raw } = fakeStore({ [NOTES_STORAGE_KEY]: '{corrupt' })
    expect(loadNotes(store)).toEqual([])
    saveNotes([makeNote('a')], store)
    expect(JSON.parse(raw() ?? '')).toEqual([makeNote('a')])
  })

  it('does not write during load', () => {
    const { store, raw } = fakeStore()
    loadNotes(store)
    expect(raw()).toBeUndefined()
  })

  it('persists an edited note across a reload', () => {
    const { store } = fakeStore()
    saveNotes([{ ...makeNote('a'), content: 'edited', updatedAt: 2 }], store)
    expect(loadNotes(store)[0]?.content).toBe('edited')
  })

  it('keeps a deleted note deleted across a reload', () => {
    const { store } = fakeStore()
    saveNotes([makeNote('a'), makeNote('b')], store)
    saveNotes([makeNote('a')], store)
    expect(loadNotes(store)).toEqual([makeNote('a')])
  })

  it('uses a storage key independent from task storage', () => {
    expect(NOTES_STORAGE_KEY).toBe('dhyaan.notes.v1')
    expect(NOTES_STORAGE_KEY).not.toBe(STORAGE_KEY)
    const { store, raw } = fakeStore({
      [NOTES_STORAGE_KEY]: JSON.stringify([makeNote('n')]),
      [STORAGE_KEY]: '{corrupt-tasks',
    })
    expect(loadNotes(store)).toEqual([makeNote('n')])
    expect(raw(STORAGE_KEY)).toBe('{corrupt-tasks')
  })
})

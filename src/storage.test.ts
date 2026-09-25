import { describe, expect, it } from 'vitest'
import { loadTasks, saveTasks, STORAGE_KEY, type TaskStore } from './storage.ts'
import type { Task } from './types.ts'

function fakeStore(seed: Record<string, string> = {}) {
  const data = new Map<string, string>(Object.entries(seed))
  const store: TaskStore = {
    getItem: (key: string) => (data.has(key) ? data.get(key) ?? null : null),
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
  }
  return {
    store,
    raw: () => (data.has(STORAGE_KEY) ? data.get(STORAGE_KEY) : undefined),
  }
}

function makeTask(id: string): Task {
  return {
    id,
    title: `task ${id}`,
    done: false,
    createdAt: 1,
    dueDate: null,
    area: null,
    notes: null,
  }
}

describe('storage', () => {
  it('round-trips valid tasks', () => {
    const { store } = fakeStore()
    const tasks = [makeTask('a'), makeTask('b')]
    saveTasks(tasks, store)
    expect(loadTasks(store)).toEqual(tasks)
  })

  it('returns empty for empty storage', () => {
    const { store } = fakeStore()
    expect(loadTasks(store)).toEqual([])
  })

  it('does not crash on malformed JSON and preserves the value', () => {
    const { store, raw } = fakeStore({ [STORAGE_KEY]: '{not-json' })
    expect(loadTasks(store)).toEqual([])
    expect(raw()).toBe('{not-json')
  })

  it('does not crash on invalid top-level structure and preserves the value', () => {
    const { store, raw } = fakeStore({ [STORAGE_KEY]: '{"a":1}' })
    expect(loadTasks(store)).toEqual([])
    expect(raw()).toBe('{"a":1}')
  })

  it('keeps valid entries and discards invalid task shapes', () => {
    const { store } = fakeStore({
      [STORAGE_KEY]: JSON.stringify([
        makeTask('good'),
        { id: 'bad', title: '' },
        'junk',
      ]),
    })
    expect(loadTasks(store)).toEqual([makeTask('good')])
  })

  it('lets a later valid mutation overwrite previously corrupt storage', () => {
    const { store, raw } = fakeStore({ [STORAGE_KEY]: '{corrupt' })
    expect(loadTasks(store)).toEqual([])
    saveTasks([makeTask('a')], store)
    expect(JSON.parse(raw() ?? '')).toEqual([makeTask('a')])
  })

  it('does not write during load', () => {
    const { store, raw } = fakeStore()
    loadTasks(store)
    expect(raw()).toBeUndefined()
  })

  it('persists completion across a reload', () => {
    const { store } = fakeStore()
    saveTasks([{ ...makeTask('a'), done: true }], store)
    expect(loadTasks(store)).toEqual([{ ...makeTask('a'), done: true }])
  })

  it('persists an edited title across a reload', () => {
    const { store } = fakeStore()
    saveTasks([{ ...makeTask('a'), title: 'renamed' }], store)
    expect(loadTasks(store)[0]?.title).toBe('renamed')
  })

  it('keeps a deleted task deleted across a reload', () => {
    const { store } = fakeStore()
    saveTasks([makeTask('a'), makeTask('b')], store)
    saveTasks([makeTask('a')], store)
    expect(loadTasks(store)).toEqual([makeTask('a')])
  })
})

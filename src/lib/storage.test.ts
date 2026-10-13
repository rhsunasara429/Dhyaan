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
    doneAt: null,
    createdAt: 1,
    dueDate: null,
    area: null,
    notes: null,
    priorityOrder: null,
    repeat: null,
    repeatGroupId: null,
  }
}

/** A task exactly as it was persisted before `doneAt` existed (pre-M6). */
function legacyTask(id: string): Record<string, unknown> {
  const task = makeTask(id) as Record<string, unknown>
  delete task.doneAt
  delete task.priorityOrder
  delete task.priority
  return task
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

  it('persists area and due date across a reload', () => {
    const { store } = fakeStore()
    const task = { ...makeTask('a'), area: 'college' as const, dueDate: '2026-10-01' }
    saveTasks([task], store)
    expect(loadTasks(store)).toEqual([task])
  })

  it('persists cleared area and due date across a reload', () => {
    const { store } = fakeStore()
    saveTasks([makeTask('a')], store)
    expect(loadTasks(store)).toEqual([makeTask('a')])
  })

  /* --- M6 migration: the highest-stakes behaviour in this file. If isTask
     ever starts requiring doneAt, these fail and real user data disappears. --- */

  it('keeps tasks stored before doneAt existed', () => {
    const { store } = fakeStore({
      [STORAGE_KEY]: JSON.stringify([legacyTask('old-a'), legacyTask('old-b')]),
    })
    const loaded = loadTasks(store)
    expect(loaded.map((task) => task.id)).toEqual(['old-a', 'old-b'])
  })

  it('normalises a missing doneAt to null on load', () => {
    const { store } = fakeStore({
      [STORAGE_KEY]: JSON.stringify([legacyTask('old-a')]),
    })
    expect(loadTasks(store)).toEqual([makeTask('old-a')])
  })

  it('preserves an existing doneAt through a reload', () => {
    const { store } = fakeStore()
    saveTasks([{ ...makeTask('a'), done: true, doneAt: 1_700_000_000_000 }], store)
    expect(loadTasks(store)[0]?.doneAt).toBe(1_700_000_000_000)
  })

  it('still discards genuinely malformed tasks during migration', () => {
    const { store } = fakeStore({
      [STORAGE_KEY]: JSON.stringify([
        legacyTask('good'),
        { id: 'bad', title: '' },
        { ...makeTask('bad-doneAt'), doneAt: 'nope' },
      ]),
    })
    expect(loadTasks(store).map((task) => task.id)).toEqual(['good'])
  })

  /* --- Repeat migration: tasks stored before repeats existed carry no keys.
     They must load as one-off, never dropped. --- */

  it('loads pre-repeat tasks as one-off', () => {
    const { store } = fakeStore({
      [STORAGE_KEY]: JSON.stringify([legacyTask('old-a')]),
    })
    const loaded = loadTasks(store)
    expect(loaded).toEqual([makeTask('old-a')])
    expect(loaded[0]?.repeat).toBeNull()
    expect(loaded[0]?.repeatGroupId).toBeNull()
  })

  it('falls back to one-off for invalid stored repeat values', () => {
    for (const bad of ['monthly', 'everyday', 1, true, {}, []]) {
      const raw = { ...makeTask('x'), repeat: bad, repeatGroupId: 'x' }
      const { store } = fakeStore({
        [STORAGE_KEY]: JSON.stringify([raw]),
      })
      const loaded = loadTasks(store)
      expect(loaded).toHaveLength(1)
      expect(loaded[0]?.repeat).toBeNull()
      expect(loaded[0]?.repeatGroupId).toBeNull()
    }
  })

  it('clears a stale group link on one-off tasks', () => {
    const raw = { ...makeTask('x'), repeat: null, repeatGroupId: 'stale' }
    const { store } = fakeStore({
      [STORAGE_KEY]: JSON.stringify([raw]),
    })
    expect(loadTasks(store)[0]?.repeatGroupId).toBeNull()
  })

  it('adopts its own id when a repeat has no group', () => {
    const raw = {
      ...makeTask('chain'),
      repeat: 'daily',
      repeatGroupId: null,
    } as Record<string, unknown>
    delete raw.repeatGroupId
    const { store } = fakeStore({
      [STORAGE_KEY]: JSON.stringify([raw]),
    })
    const loaded = loadTasks(store)
    expect(loaded[0]?.repeat).toBe('daily')
    expect(loaded[0]?.repeatGroupId).toBe('chain')
  })

  it('round-trips a repeat chain', () => {
    const { store } = fakeStore()
    const task = {
      ...makeTask('a'),
      dueDate: '2026-10-13',
      repeat: 'weekly' as const,
      repeatGroupId: 'a',
    }
    saveTasks([task], store)
    expect(loadTasks(store)).toEqual([task])
  })
})

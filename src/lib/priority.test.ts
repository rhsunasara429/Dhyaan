import { describe, expect, it } from 'vitest'
import { loadTasks, saveTasks, STORAGE_KEY, type TaskStore } from './storage.ts'
import {
  selectDueToday,
  selectInbox,
  selectOverdue,
  selectUpcoming,
} from './selectors.ts'
import {
  buildTask,
  deleteTask,
  isTask,
  renameTask,
  setTaskPriority,
  toggleTask,
  updateTask,
} from './tasks.ts'
import type { Task } from './types.ts'

const TODAY = '2026-09-25'

function makeTask(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: `task ${id}`,
    done: false,
    doneAt: null,
    createdAt: 100,
    dueDate: null,
    area: null,
    notes: null,
    priority: 'normal',
    ...overrides,
  }
}

function fakeStore(seed: Record<string, string> = {}) {
  const data = new Map<string, string>(Object.entries(seed))
  const store: TaskStore = {
    getItem: (key: string) => (data.has(key) ? data.get(key) ?? null : null),
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
  }
  return { store }
}

describe('task priority', () => {
  it('loads existing stored tasks without a priority as Normal', () => {
    const legacy = {
      id: 'old',
      title: 'old task',
      done: false,
      doneAt: null,
      createdAt: 1,
      dueDate: null,
      area: null,
      notes: null,
    }
    const { store } = fakeStore({
      [STORAGE_KEY]: JSON.stringify([legacy]),
    })
    const loaded = loadTasks(store)
    expect(loaded).toHaveLength(1)
    expect(loaded[0]?.priority).toBe('normal')
  })

  it('defaults newly created tasks to Normal', () => {
    expect(buildTask('Study physics')?.priority).toBe('normal')
  })

  it('persists Important and Normal values across a reload', () => {
    const { store } = fakeStore()
    saveTasks(
      [
        makeTask('a', { priority: 'important' }),
        makeTask('b', { priority: 'normal' }),
      ],
      store,
    )
    const loaded = loadTasks(store)
    expect(loaded.map((t) => [t.id, t.priority])).toEqual([
      ['a', 'important'],
      ['b', 'normal'],
    ])
  })

  it('falls back to Normal for invalid stored priority values', () => {
    for (const bad of ['urgent', 'HIGH', '', 42, null, true]) {
      const raw = {
        ...makeTask('x'),
        priority: bad,
      }
      const { store } = fakeStore({
        [STORAGE_KEY]: JSON.stringify([raw]),
      })
      const loaded = loadTasks(store)
      expect(loaded).toHaveLength(1)
      expect(loaded[0]?.priority).toBe('normal')
    }
  })

  it('accepts stored tasks with missing or invalid priority instead of dropping them', () => {
    const missing = { ...makeTask('a') } as Record<string, unknown>
    delete missing.priority
    expect(isTask(missing)).toBe(true)
    const invalid = { ...makeTask('b'), priority: 'urgent' }
    expect(isTask(invalid)).toBe(true)
  })

  it('orders Important before Normal in Overdue', () => {
    const normal = makeTask('n', {
      dueDate: '2026-09-20',
      createdAt: 200,
      priority: 'normal',
    })
    const important = makeTask('i', {
      dueDate: '2026-09-24',
      createdAt: 100,
      priority: 'important',
    })
    // Important sorts first even with a later due date.
    expect(selectOverdue([normal, important], TODAY).map((t) => t.id)).toEqual([
      'i',
      'n',
    ])
  })

  it('orders Important before Normal in due-today', () => {
    const normal = makeTask('n', {
      dueDate: TODAY,
      createdAt: 200,
      priority: 'normal',
    })
    const important = makeTask('i', {
      dueDate: TODAY,
      createdAt: 100,
      priority: 'important',
    })
    expect(selectDueToday([normal, important], TODAY).map((t) => t.id)).toEqual(
      ['i', 'n'],
    )
  })

  it('orders Important before Normal in Upcoming', () => {
    const normal = makeTask('n', {
      dueDate: '2026-09-26',
      createdAt: 200,
      priority: 'normal',
    })
    const important = makeTask('i', {
      dueDate: '2026-10-01',
      createdAt: 100,
      priority: 'important',
    })
    expect(selectUpcoming([normal, important], TODAY).map((t) => t.id)).toEqual(
      ['i', 'n'],
    )
  })

  it('preserves existing ordering within the same priority', () => {
    // Due-today existing order is newest first.
    const tOld = makeTask('t-old', {
      dueDate: TODAY,
      createdAt: 1,
      priority: 'important',
    })
    const tNew = makeTask('t-new', {
      dueDate: TODAY,
      createdAt: 2,
      priority: 'important',
    })
    expect(selectDueToday([tOld, tNew], TODAY).map((t) => t.id)).toEqual([
      't-new',
      't-old',
    ])
    // Overdue existing order is oldest due date first, newest ties first.
    const older = makeTask('older', {
      dueDate: '2026-09-20',
      createdAt: 1,
      priority: 'normal',
    })
    const tieNew = makeTask('tie-new', {
      dueDate: '2026-09-24',
      createdAt: 50,
      priority: 'normal',
    })
    const tieOld = makeTask('tie-old', {
      dueDate: '2026-09-24',
      createdAt: 10,
      priority: 'normal',
    })
    expect(
      selectOverdue([tieOld, older, tieNew], TODAY).map((t) => t.id),
    ).toEqual(['older', 'tie-new', 'tie-old'])
  })

  it('updates Today ordering immediately when priority changes', () => {
    const tasks = [
      makeTask('a', { dueDate: TODAY, createdAt: 200, priority: 'normal' }),
      makeTask('b', { dueDate: TODAY, createdAt: 100, priority: 'normal' }),
    ]
    expect(selectDueToday(tasks, TODAY).map((t) => t.id)).toEqual(['a', 'b'])
    const next = setTaskPriority(tasks, 'b', 'important')
    expect(next).not.toBeNull()
    expect(selectDueToday(next ?? [], TODAY).map((t) => t.id)).toEqual([
      'b',
      'a',
    ])
  })

  it('keeps Inbox ordering unchanged (newest first, no priority sorting)', () => {
    const importantOld = makeTask('old', {
      createdAt: 100,
      priority: 'important',
    })
    const normalNew = makeTask('new', { createdAt: 300, priority: 'normal' })
    const normalMid = makeTask('mid', { createdAt: 200, priority: 'normal' })
    expect(
      selectInbox([importantOld, normalNew, normalMid]).map((t) => t.id),
    ).toEqual(['new', 'mid', 'old'])
  })

  it('keeps priority out of section boundaries', () => {
    const importantInbox = makeTask('inbox', { priority: 'important' })
    expect(selectOverdue([importantInbox], TODAY)).toEqual([])
    expect(selectDueToday([importantInbox], TODAY)).toEqual([])
    expect(selectUpcoming([importantInbox], TODAY)).toEqual([])
    expect(selectInbox([importantInbox]).map((t) => t.id)).toEqual(['inbox'])
  })

  it('preserves completion, edit, and delete behavior with priority present', () => {
    const task = makeTask('a', {
      priority: 'important',
      dueDate: TODAY,
      area: 'college',
      notes: 'keep',
    })
    // Completion preserves priority.
    const done = toggleTask([task], 'a', 555)
    expect(done[0]).toEqual({ ...task, done: true, doneAt: 555 })
    // Edit can change priority and preserves other fields.
    const edited = updateTask([task], 'a', {
      title: 'renamed',
      area: 'learning',
      dueDate: TODAY,
      priority: 'normal',
    })
    expect(edited?.[0]).toEqual({
      ...task,
      title: 'renamed',
      area: 'learning',
      dueDate: TODAY,
      priority: 'normal',
    })
    // Edit without a priority key preserves the existing priority.
    const preserved = updateTask([task], 'a', {
      title: 'renamed',
      area: task.area,
      dueDate: task.dueDate,
    })
    expect(preserved?.[0]?.priority).toBe('important')
    // Invalid priority values are rejected.
    expect(
      updateTask([task], 'a', {
        title: 'ok',
        area: null,
        dueDate: null,
        priority: 'urgent',
      }),
    ).toBeNull()
    expect(setTaskPriority([task], 'a', 'urgent')).toBeNull()
    // Rename and delete still work.
    expect(renameTask([task], 'a', 'new name')?.[0]?.title).toBe('new name')
    expect(deleteTask([task, makeTask('b')], 'a').map((t) => t.id)).toEqual([
      'b',
    ])
  })
})

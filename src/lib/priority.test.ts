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
  togglePriorityOrder,
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
    priorityOrder: null,
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

describe('task priority order (click-to-rank)', () => {
  it('loads existing stored tasks without a rank as unranked', () => {
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
    expect(loaded[0]?.priorityOrder).toBeNull()
  })

  it('defaults newly created tasks to unranked', () => {
    expect(buildTask('Study physics')?.priorityOrder).toBeNull()
  })

  it('persists ranks across a reload', () => {
    const { store } = fakeStore()
    saveTasks(
      [
        makeTask('a', { priorityOrder: 1 }),
        makeTask('b', { priorityOrder: 2 }),
        makeTask('c', { priorityOrder: null }),
      ],
      store,
    )
    const loaded = loadTasks(store)
    expect(loaded.map((t) => [t.id, t.priorityOrder])).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', null],
    ])
  })

  it('falls back to unranked for invalid stored rank values', () => {
    for (const bad of [0, -1, 1.5, NaN, '1', 'urgent', true, {}, []]) {
      const raw = {
        ...makeTask('x'),
        priorityOrder: bad,
      }
      const { store } = fakeStore({
        [STORAGE_KEY]: JSON.stringify([raw]),
      })
      const loaded = loadTasks(store)
      expect(loaded).toHaveLength(1)
      expect(loaded[0]?.priorityOrder).toBeNull()
    }
  })

  it('accepts stored tasks with missing or invalid rank instead of dropping them', () => {
    const missing = { ...makeTask('a') } as Record<string, unknown>
    delete missing.priorityOrder
    expect(isTask(missing)).toBe(true)
    const invalid = { ...makeTask('b'), priorityOrder: 'urgent' }
    expect(isTask(invalid)).toBe(true)
  })

  it('migrates legacy Important tasks to ranks, newest first', () => {
    const oldImportant = {
      ...makeTask('old'),
      priority: 'important',
      createdAt: 100,
    }
    const newImportant = {
      ...makeTask('new'),
      priority: 'important',
      createdAt: 300,
    }
    const normal = { ...makeTask('n'), priority: 'normal' }
    const { store } = fakeStore({
      [STORAGE_KEY]: JSON.stringify([oldImportant, normal, newImportant]),
    })
    const loaded = loadTasks(store)
    const byId = new Map(loaded.map((t) => [t.id, t.priorityOrder]))
    // Newest important becomes P1, oldest P2, normal stays unranked.
    expect(byId.get('new')).toBe(1)
    expect(byId.get('old')).toBe(2)
    expect(byId.get('n')).toBeNull()
  })

  it('assigns P1 then P2 in star-click order (Maths then C++)', () => {
    const tasks = [
      makeTask('maths', { dueDate: TODAY, createdAt: 100 }),
      makeTask('cpp', { dueDate: TODAY, createdAt: 200 }),
    ]
    const afterMaths = togglePriorityOrder(tasks, 'maths')
    expect(afterMaths?.find((t) => t.id === 'maths')?.priorityOrder).toBe(1)
    const afterCpp = togglePriorityOrder(afterMaths ?? [], 'cpp')
    expect(afterCpp?.find((t) => t.id === 'maths')?.priorityOrder).toBe(1)
    expect(afterCpp?.find((t) => t.id === 'cpp')?.priorityOrder).toBe(2)
    // Today shows Maths first, then C++.
    expect(selectDueToday(afterCpp ?? [], TODAY).map((t) => t.id)).toEqual([
      'maths',
      'cpp',
    ])
  })

  it('re-clicking a ranked task clears it and shifts higher ranks up', () => {
    const tasks = [
      makeTask('a', { priorityOrder: 1 }),
      makeTask('b', { priorityOrder: 2 }),
      makeTask('c', { priorityOrder: 3 }),
    ]
    const next = togglePriorityOrder(tasks, 'a')
    expect(next?.find((t) => t.id === 'a')?.priorityOrder).toBeNull()
    expect(next?.find((t) => t.id === 'b')?.priorityOrder).toBe(1)
    expect(next?.find((t) => t.id === 'c')?.priorityOrder).toBe(2)
  })

  it('orders P1 before P2 before unranked in Overdue', () => {
    const unranked = makeTask('u', {
      dueDate: '2026-09-20',
      createdAt: 200,
      priorityOrder: null,
    })
    const p2 = makeTask('p2', {
      dueDate: '2026-09-20',
      createdAt: 100,
      priorityOrder: 2,
    })
    const p1 = makeTask('p1', {
      dueDate: '2026-09-24',
      createdAt: 50,
      priorityOrder: 1,
    })
    // P1 sorts first even with a later due date.
    expect(selectOverdue([unranked, p2, p1], TODAY).map((t) => t.id)).toEqual([
      'p1',
      'p2',
      'u',
    ])
  })

  it('orders P1 before P2 before unranked in due-today', () => {
    const unranked = makeTask('u', {
      dueDate: TODAY,
      createdAt: 500,
      priorityOrder: null,
    })
    const p2 = makeTask('p2', {
      dueDate: TODAY,
      createdAt: 100,
      priorityOrder: 2,
    })
    const p1 = makeTask('p1', {
      dueDate: TODAY,
      createdAt: 50,
      priorityOrder: 1,
    })
    expect(selectDueToday([unranked, p2, p1], TODAY).map((t) => t.id)).toEqual([
      'p1',
      'p2',
      'u',
    ])
  })

  it('orders P1 before P2 before unranked in Upcoming', () => {
    const unranked = makeTask('u', {
      dueDate: '2026-09-26',
      createdAt: 500,
      priorityOrder: null,
    })
    const p2 = makeTask('p2', {
      dueDate: '2026-09-26',
      createdAt: 100,
      priorityOrder: 2,
    })
    const p1 = makeTask('p1', {
      dueDate: '2026-10-01',
      createdAt: 50,
      priorityOrder: 1,
    })
    expect(selectUpcoming([unranked, p2, p1], TODAY).map((t) => t.id)).toEqual([
      'p1',
      'p2',
      'u',
    ])
  })

  it('preserves existing ordering among unranked tasks', () => {
    // Due-today unranked order is newest first.
    const tOld = makeTask('t-old', {
      dueDate: TODAY,
      createdAt: 1,
      priorityOrder: null,
    })
    const tNew = makeTask('t-new', {
      dueDate: TODAY,
      createdAt: 2,
      priorityOrder: null,
    })
    expect(selectDueToday([tOld, tNew], TODAY).map((t) => t.id)).toEqual([
      't-new',
      't-old',
    ])
    // Overdue unranked order is oldest due date first, newest ties first.
    const older = makeTask('older', {
      dueDate: '2026-09-20',
      createdAt: 1,
      priorityOrder: null,
    })
    const tieNew = makeTask('tie-new', {
      dueDate: '2026-09-24',
      createdAt: 50,
      priorityOrder: null,
    })
    const tieOld = makeTask('tie-old', {
      dueDate: '2026-09-24',
      createdAt: 10,
      priorityOrder: null,
    })
    expect(
      selectOverdue([tieOld, older, tieNew], TODAY).map((t) => t.id),
    ).toEqual(['older', 'tie-new', 'tie-old'])
  })

  it('updates Today ordering immediately when rank changes', () => {
    const tasks = [
      makeTask('a', { dueDate: TODAY, createdAt: 200, priorityOrder: null }),
      makeTask('b', { dueDate: TODAY, createdAt: 100, priorityOrder: null }),
    ]
    expect(selectDueToday(tasks, TODAY).map((t) => t.id)).toEqual(['a', 'b'])
    const next = togglePriorityOrder(tasks, 'b')
    expect(next).not.toBeNull()
    expect(selectDueToday(next ?? [], TODAY).map((t) => t.id)).toEqual([
      'b',
      'a',
    ])
  })

  it('keeps Inbox ordering unchanged (newest first, no rank sorting)', () => {
    const rankedOld = makeTask('old', {
      createdAt: 100,
      priorityOrder: 1,
    })
    const unrankedNew = makeTask('new', { createdAt: 300, priorityOrder: null })
    const unrankedMid = makeTask('mid', { createdAt: 200, priorityOrder: null })
    expect(
      selectInbox([rankedOld, unrankedNew, unrankedMid]).map((t) => t.id),
    ).toEqual(['new', 'mid', 'old'])
  })

  it('keeps rank out of section boundaries', () => {
    const rankedInbox = makeTask('inbox', { priorityOrder: 1 })
    expect(selectOverdue([rankedInbox], TODAY)).toEqual([])
    expect(selectDueToday([rankedInbox], TODAY)).toEqual([])
    expect(selectUpcoming([rankedInbox], TODAY)).toEqual([])
    expect(selectInbox([rankedInbox]).map((t) => t.id)).toEqual(['inbox'])
  })

  it('completing a ranked task clears it and shifts higher ranks', () => {
    const tasks = [
      makeTask('a', { priorityOrder: 1, dueDate: TODAY }),
      makeTask('b', { priorityOrder: 2, dueDate: TODAY }),
    ]
    const done = toggleTask(tasks, 'a', 555)
    expect(done.find((t) => t.id === 'a')?.priorityOrder).toBeNull()
    expect(done.find((t) => t.id === 'a')?.done).toBe(true)
    expect(done.find((t) => t.id === 'b')?.priorityOrder).toBe(1)
  })

  it('deleting a ranked task shifts higher ranks', () => {
    const tasks = [
      makeTask('a', { priorityOrder: 1 }),
      makeTask('b', { priorityOrder: 2 }),
      makeTask('c', { priorityOrder: 3 }),
    ]
    const next = deleteTask(tasks, 'b')
    expect(next.map((t) => t.id)).toEqual(['a', 'c'])
    expect(next.find((t) => t.id === 'c')?.priorityOrder).toBe(2)
  })

  it('preserves completion, edit, and delete behavior with rank present', () => {
    const task = makeTask('a', {
      priorityOrder: 1,
      dueDate: TODAY,
      area: 'college',
      notes: 'keep',
    })
    // Completion preserves other fields but clears the rank.
    const done = toggleTask([task], 'a', 555)
    expect(done[0]).toEqual({ ...task, done: true, doneAt: 555, priorityOrder: null })
    // Edit preserves the rank and other fields.
    const edited = updateTask([task], 'a', {
      title: 'renamed',
      area: 'learning',
      dueDate: TODAY,
    })
    expect(edited?.[0]).toEqual({
      ...task,
      title: 'renamed',
      area: 'learning',
      dueDate: TODAY,
    })
    expect(edited?.[0]?.priorityOrder).toBe(1)
    // Unknown id returns null.
    expect(togglePriorityOrder([task], 'missing')).toBeNull()
    // Rename and delete still work.
    expect(renameTask([task], 'a', 'new name')?.[0]?.title).toBe('new name')
    expect(deleteTask([task, makeTask('b')], 'a').map((t) => t.id)).toEqual([
      'b',
    ])
  })
})

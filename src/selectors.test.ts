import { describe, expect, it } from 'vitest'
import {
  selectCompleted,
  selectDueToday,
  selectInbox,
  selectOverdue,
  selectUpcoming,
} from './selectors.ts'
import type { Task } from './types.ts'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'id',
    title: 'title',
    done: false,
    doneAt: null,
    createdAt: 0,
    dueDate: null,
    area: null,
    notes: null,
    priority: 'normal',
    ...overrides,
  }
}

describe('selectInbox', () => {
  it('includes incomplete undated tasks', () => {
    const task = makeTask({ id: 'a' })
    expect(selectInbox([task])).toEqual([task])
  })

  it('excludes completed tasks', () => {
    const task = makeTask({ id: 'a', done: true })
    expect(selectInbox([task])).toEqual([])
  })

  it('excludes dated tasks', () => {
    const task = makeTask({ id: 'a', dueDate: '2026-09-25' })
    expect(selectInbox([task])).toEqual([])
  })

  it('sorts newest first', () => {
    const oldTask = makeTask({ id: 'old', createdAt: 100 })
    const newTask = makeTask({ id: 'new', createdAt: 300 })
    const midTask = makeTask({ id: 'mid', createdAt: 200 })
    expect(selectInbox([oldTask, newTask, midTask]).map((t) => t.id)).toEqual([
      'new',
      'mid',
      'old',
    ])
  })
})

describe('selectCompleted', () => {
  it('returns completed tasks', () => {
    const done = makeTask({ id: 'done', done: true })
    expect(selectCompleted([done])).toEqual([done])
  })

  it('excludes active tasks', () => {
    expect(selectCompleted([makeTask({ id: 'a' })])).toEqual([])
  })

  it('orders newest first', () => {
    const oldTask = makeTask({ id: 'old', done: true, createdAt: 100 })
    const newTask = makeTask({ id: 'new', done: true, createdAt: 300 })
    expect(selectCompleted([oldTask, newTask]).map((t) => t.id)).toEqual([
      'new',
      'old',
    ])
  })

  it('keeps completed tasks out of the Inbox', () => {
    const done = makeTask({ id: 'done', done: true })
    expect(selectInbox([done])).toEqual([])
  })
})

const TODAY = '2026-09-25'

describe('date selectors', () => {
  it('selects overdue tasks with dueDate < today', () => {
    const overdue = makeTask({ id: 'o', dueDate: '2026-09-24' })
    const today = makeTask({ id: 't', dueDate: TODAY })
    const future = makeTask({ id: 'f', dueDate: '2026-09-26' })
    expect(selectOverdue([overdue, today, future], TODAY)).toEqual([overdue])
  })

  it('selects only tasks due exactly today', () => {
    const today = makeTask({ id: 't', dueDate: TODAY })
    const overdue = makeTask({ id: 'o', dueDate: '2026-09-24' })
    expect(selectDueToday([today, overdue], TODAY)).toEqual([today])
  })

  it('selects only future tasks for upcoming', () => {
    const future = makeTask({ id: 'f', dueDate: '2026-09-26' })
    const today = makeTask({ id: 't', dueDate: TODAY })
    expect(selectUpcoming([future, today], TODAY)).toEqual([future])
  })

  it('excludes completed and undated tasks from all date selectors', () => {
    const done = makeTask({ id: 'd', done: true, dueDate: TODAY })
    const undated = makeTask({ id: 'u', dueDate: null })
    expect(selectOverdue([done, undated], TODAY)).toEqual([])
    expect(selectDueToday([done, undated], TODAY)).toEqual([])
    expect(selectUpcoming([done, undated], TODAY)).toEqual([])
  })

  it('orders overdue oldest due date first with newest ties first', () => {
    const older = makeTask({ id: 'older', dueDate: '2026-09-20', createdAt: 1 })
    const newerDate = makeTask({
      id: 'newer-date',
      dueDate: '2026-09-24',
      createdAt: 100,
    })
    const tieNew = makeTask({
      id: 'tie-new',
      dueDate: '2026-09-24',
      createdAt: 50,
    })
    const tieOld = makeTask({
      id: 'tie-old',
      dueDate: '2026-09-24',
      createdAt: 10,
    })
    const tasks = [tieOld, newerDate, older, tieNew]
    expect(selectOverdue(tasks, TODAY).map((t) => t.id)).toEqual([
      'older',
      'newer-date',
      'tie-new',
      'tie-old',
    ])
  })

  it('orders today newest first and upcoming earliest date first', () => {
    const tOld = makeTask({ id: 't-old', dueDate: TODAY, createdAt: 1 })
    const tNew = makeTask({ id: 't-new', dueDate: TODAY, createdAt: 2 })
    expect(selectDueToday([tOld, tNew], TODAY).map((t) => t.id)).toEqual([
      't-new',
      't-old',
    ])
    const far = makeTask({ id: 'far', dueDate: '2026-10-01', createdAt: 99 })
    const near = makeTask({ id: 'near', dueDate: '2026-09-26', createdAt: 1 })
    expect(selectUpcoming([far, near], TODAY).map((t) => t.id)).toEqual([
      'near',
      'far',
    ])
  })
})

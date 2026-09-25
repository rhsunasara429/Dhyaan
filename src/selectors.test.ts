import { describe, expect, it } from 'vitest'
import { selectCompleted, selectInbox } from './selectors.ts'
import type { Task } from './types.ts'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'id',
    title: 'title',
    done: false,
    createdAt: 0,
    dueDate: null,
    area: null,
    notes: null,
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

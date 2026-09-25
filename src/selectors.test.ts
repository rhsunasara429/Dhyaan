import { describe, expect, it } from 'vitest'
import { selectInbox } from './selectors.ts'
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

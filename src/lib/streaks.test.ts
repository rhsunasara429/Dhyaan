import { describe, expect, it } from 'vitest'
import { countCompletedOn, currentStreak } from './streaks.ts'
import type { Task } from './types.ts'

function makeTask(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: `task ${id}`,
    done: true,
    doneAt: null,
    createdAt: 0,
    dueDate: null,
    area: null,
    notes: null,
    priorityOrder: null,
    ...overrides,
  }
}

/** Local noon keeps these unambiguous regardless of the runner's timezone. */
function localNoon(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day, 12, 0, 0, 0).getTime()
}

describe('countCompletedOn', () => {
  it('counts nothing for an empty list', () => {
    expect(countCompletedOn([], '2026-10-09')).toBe(0)
  })

  it('counts tasks completed on the given day', () => {
    const tasks = [
      makeTask('a', { doneAt: localNoon(2026, 10, 9) }),
      makeTask('b', { doneAt: localNoon(2026, 10, 9) }),
    ]
    expect(countCompletedOn(tasks, '2026-10-09')).toBe(2)
  })

  it('does not count completions from other days', () => {
    const tasks = [
      makeTask('yesterday', { doneAt: localNoon(2026, 10, 8) }),
      makeTask('today', { doneAt: localNoon(2026, 10, 9) }),
      makeTask('tomorrow', { doneAt: localNoon(2026, 10, 10) }),
    ]
    expect(countCompletedOn(tasks, '2026-10-09')).toBe(1)
  })

  it('ignores open tasks even when they carry a doneAt', () => {
    const tasks = [makeTask('a', { done: false, doneAt: localNoon(2026, 10, 9) })]
    expect(countCompletedOn(tasks, '2026-10-09')).toBe(0)
  })

  it('ignores tasks completed before doneAt existed', () => {
    const tasks = [makeTask('legacy', { done: true, doneAt: null })]
    expect(countCompletedOn(tasks, '2026-10-09')).toBe(0)
  })

  it('separates the same clock time on consecutive days', () => {
    const tasks = [
      makeTask('a', { doneAt: localNoon(2026, 10, 9) }),
      makeTask('b', { doneAt: localNoon(2026, 10, 10) }),
    ]
    expect(countCompletedOn(tasks, '2026-10-09')).toBe(1)
    expect(countCompletedOn(tasks, '2026-10-10')).toBe(1)
  })

  it('spans a month boundary', () => {
    const tasks = [
      makeTask('last', { doneAt: localNoon(2026, 9, 30) }),
      makeTask('first', { doneAt: localNoon(2026, 10, 1) }),
    ]
    expect(countCompletedOn(tasks, '2026-09-30')).toBe(1)
    expect(countCompletedOn(tasks, '2026-10-01')).toBe(1)
  })

  it('uses local time rather than UTC for a late-evening completion', () => {
    const lateEvening = new Date(2026, 9, 9, 23, 30, 0, 0).getTime()
    expect(countCompletedOn([makeTask('a', { doneAt: lateEvening })], '2026-10-09')).toBe(1)
  })
})

describe('currentStreak', () => {
  it('is zero with no completions', () => {
    expect(currentStreak([], '2026-10-09')).toBe(0)
  })

  it('is one when only today is complete', () => {
    const tasks = [makeTask('a', { doneAt: localNoon(2026, 10, 9) })]
    expect(currentStreak(tasks, '2026-10-09')).toBe(1)
    expect(currentStreak(tasks, '2026-10-10')).toBe(1)
  })

  it('counts consecutive days back from today', () => {
    const tasks = [
      makeTask('a', { doneAt: localNoon(2026, 10, 7) }),
      makeTask('b', { doneAt: localNoon(2026, 10, 8) }),
      makeTask('c', { doneAt: localNoon(2026, 10, 9) }),
    ]
    expect(currentStreak(tasks, '2026-10-09')).toBe(3)
  })

  it('stays alive through yesterday when today is not done yet', () => {
    const tasks = [
      makeTask('a', { doneAt: localNoon(2026, 10, 7) }),
      makeTask('b', { doneAt: localNoon(2026, 10, 8) }),
    ]
    expect(currentStreak(tasks, '2026-10-09')).toBe(2)
  })

  it('breaks at the first day without a completion', () => {
    const tasks = [
      makeTask('a', { doneAt: localNoon(2026, 10, 5) }),
      makeTask('b', { doneAt: localNoon(2026, 10, 6) }),
      makeTask('c', { doneAt: localNoon(2026, 10, 8) }),
    ]
    expect(currentStreak(tasks, '2026-10-08')).toBe(1)
    expect(currentStreak(tasks, '2026-10-09')).toBe(1)
  })

  it('ignores completions with doneAt null', () => {
    const tasks = [
      makeTask('legacy', { done: true, doneAt: null }),
      makeTask('a', { doneAt: localNoon(2026, 10, 9) }),
    ]
    expect(currentStreak(tasks, '2026-10-09')).toBe(1)
  })

  it('spans a month boundary', () => {
    const tasks = [
      makeTask('a', { doneAt: localNoon(2026, 9, 30) }),
      makeTask('b', { doneAt: localNoon(2026, 10, 1) }),
    ]
    expect(currentStreak(tasks, '2026-10-01')).toBe(2)
  })

  it('does not count open tasks carrying a doneAt', () => {
    const tasks = [makeTask('a', { done: false, doneAt: localNoon(2026, 10, 9) })]
    expect(currentStreak(tasks, '2026-10-09')).toBe(0)
  })
})
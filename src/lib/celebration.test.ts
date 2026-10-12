import { describe, expect, it } from 'vitest'
import { MILESTONES, resolveCelebration } from './celebration.ts'

const base = {
  completing: true,
  inToday: true,
  todayRemaining: 4,
  completedToday: 0,
}

describe('resolveCelebration', () => {
  it('gives nothing on a plain completion', () => {
    expect(resolveCelebration(base)).toBeNull()
  })

  it('gives nothing when un-completing a task', () => {
    const result = resolveCelebration({
      ...base,
      completing: false,
      todayRemaining: 1,
      completedToday: 2,
    })
    expect(result).toBeNull()
  })

  it('does not clear Today when an Inbox task is the last one completed', () => {
    const result = resolveCelebration({
      ...base,
      inToday: false,
      todayRemaining: 1,
      completedToday: 2,
    })
    // Still earns the milestone it crossed, but must not claim Today is clear.
    expect(result?.tier).toBe('milestone')
  })

  it('gives nothing for an Inbox task when no milestone is crossed', () => {
    const result = resolveCelebration({
      ...base,
      inToday: false,
      todayRemaining: 1,
      completedToday: 1,
    })
    expect(result).toBeNull()
  })

  it('clears Today when the last remaining task is completed', () => {
    const result = resolveCelebration({ ...base, todayRemaining: 1 })
    expect(result?.tier).toBe('clear')
  })

  it('clears Today when nothing else was open', () => {
    const result = resolveCelebration({ ...base, todayRemaining: 0 })
    expect(result?.tier).toBe('clear')
  })

  it('celebrates each milestone exactly once', () => {
    for (const milestone of MILESTONES) {
      const result = resolveCelebration({
        ...base,
        todayRemaining: 5,
        completedToday: milestone - 1,
      })
      expect(result?.tier, `milestone ${milestone}`).toBe('milestone')
      expect(result?.message).toBe(`${milestone} done today`)
    }
  })

  it('does not celebrate the day after a milestone', () => {
    const result = resolveCelebration({ ...base, completedToday: 5 })
    expect(result).toBeNull()
  })

  it('prefers the clear tier over a milestone on the same tap', () => {
    const result = resolveCelebration({
      ...base,
      todayRemaining: 1,
      completedToday: 4,
    })
    expect(result?.tier).toBe('clear')
  })
})
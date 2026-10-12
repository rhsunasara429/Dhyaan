import { describe, expect, it } from 'vitest'
import { addDaysLocal, formatLongDate, greetingForHour, todayLocal } from './dates.ts'

describe('todayLocal', () => {
  it('returns YYYY-MM-DD with zero padding', () => {
    expect(todayLocal(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(todayLocal(new Date(2026, 11, 25))).toBe('2026-12-25')
  })

  it('matches YYYY-MM-DD shape for the current date', () => {
    expect(todayLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('addDaysLocal', () => {
  it('adds days across month boundaries', () => {
    expect(addDaysLocal('2026-01-31', 1)).toBe('2026-02-01')
  })

  it('subtracts days across year boundaries', () => {
    expect(addDaysLocal('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('returns the same date for zero days', () => {
    expect(addDaysLocal('2026-09-25', 0)).toBe('2026-09-25')
  })
})

describe('formatLongDate', () => {
  it('formats a day key with weekday, month and day', () => {
    expect(formatLongDate('2024-01-01')).toBe('Monday, January 1')
  })

  it('zero-pads single-digit days', () => {
    expect(formatLongDate('2026-10-11')).toBe('Sunday, October 11')
  })
})

describe('greetingForHour', () => {
  it('greets by time of day', () => {
    expect(greetingForHour(6)).toBe('Good morning')
    expect(greetingForHour(11)).toBe('Good morning')
    expect(greetingForHour(12)).toBe('Good afternoon')
    expect(greetingForHour(16)).toBe('Good afternoon')
    expect(greetingForHour(17)).toBe('Good evening')
    expect(greetingForHour(23)).toBe('Good evening')
    expect(greetingForHour(0)).toBe('Good morning')
  })
})

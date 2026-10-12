import { describe, expect, it } from 'vitest'
import {
  isReminderHour,
  msUntilNextReminderHour,
  reminderCopy,
  resolveReminder,
} from './reminders.ts'

const DAY = '2026-10-09'

function at(hours: number, minutes = 0): Date {
  return new Date(2026, 9, 9, hours, minutes, 0, 0)
}

const open = { openTodayCount: 3, alreadyShownDay: null, today: DAY }

describe('isReminderHour', () => {
  it('is false before the hour', () => {
    expect(isReminderHour(at(0))).toBe(false)
    expect(isReminderHour(at(19, 59))).toBe(false)
  })

  it('is true from the hour onwards', () => {
    expect(isReminderHour(at(20, 0))).toBe(true)
    expect(isReminderHour(at(23, 30))).toBe(true)
  })

  it('uses local hours rather than UTC', () => {
    // Late-evening local time in any timezone is still the local hour.
    expect(isReminderHour(new Date(2026, 9, 9, 20, 30))).toBe(true)
  })
})

describe('resolveReminder', () => {
  it('stays quiet before the hour even with open work', () => {
    expect(resolveReminder({ ...open, now: at(19, 59) })).toEqual({ kind: 'none' })
  })

  it('fires at the hour with open work', () => {
    expect(resolveReminder({ ...open, now: at(20, 0) })).toEqual({
      kind: 'due',
      openCount: 3,
    })
  })

  it('catches up late in the evening', () => {
    expect(resolveReminder({ ...open, now: at(23, 40) }).kind).toBe('due')
  })

  it('fires only once per day', () => {
    expect(
      resolveReminder({ ...open, alreadyShownDay: DAY, now: at(21, 0) }),
    ).toEqual({ kind: 'none' })
  })

  it('fires again once the day rolls over', () => {
    expect(
      resolveReminder({
        openTodayCount: 3,
        alreadyShownDay: '2026-10-08',
        today: DAY,
        now: at(20, 30),
      }).kind,
    ).toBe('due')
  })

  it('stays quiet when nothing is open', () => {
    expect(
      resolveReminder({ ...open, openTodayCount: 0, now: at(20, 30) }),
    ).toEqual({ kind: 'none' })
  })

  it('does not fire before the hour even if already shown yesterday', () => {
    expect(
      resolveReminder({
        openTodayCount: 2,
        alreadyShownDay: '2026-10-08',
        today: DAY,
        now: at(10, 0),
      }),
    ).toEqual({ kind: 'none' })
  })
})

describe('reminderCopy', () => {
  it('uses singular wording for one task', () => {
    expect(reminderCopy(1).title).toBe('1 task still open')
  })

  it('uses plural wording otherwise', () => {
    expect(reminderCopy(4).title).toBe('4 tasks still open')
  })
})

describe('msUntilNextReminderHour', () => {
  it('targets tonight when the hour has not passed', () => {
    expect(msUntilNextReminderHour(at(9, 0))).toBe(11 * 60 * 60 * 1000)
  })

  it('targets tomorrow once the hour has passed', () => {
    // 22:00 -> next 20:00 is 22 hours away.
    expect(msUntilNextReminderHour(at(22, 0))).toBe(22 * 60 * 60 * 1000)
  })

  it('is always strictly positive', () => {
    expect(msUntilNextReminderHour(at(20, 0))).toBeGreaterThan(0)
  })
})
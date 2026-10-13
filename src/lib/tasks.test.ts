import { describe, expect, it } from 'vitest'
import {
  buildNextRepeatInstance,
  buildTask,
  deleteTask,
  hasOpenRepeatInstance,
  isRepeat,
  MAX_TITLE_LENGTH,
  moveTaskToToday,
  nextRepeatDueDate,
  renameTask,
  toggleTask,
  toggleTaskWithRepeat,
  updateTask,
} from './tasks.ts'
import type { Task } from './types.ts'

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
    repeat: null,
    repeatGroupId: null,
    ...overrides,
  }
}

describe('buildTask', () => {
  it('creates a valid task with M1 defaults', () => {
    const task = buildTask('BME assignment 3')
    expect(task).not.toBeNull()
    expect(task?.title).toBe('BME assignment 3')
    expect(typeof task?.id).toBe('string')
    expect(task?.id.length).toBeGreaterThan(0)
    expect(task?.done).toBe(false)
    expect(task?.dueDate).toBeNull()
    expect(task?.area).toBeNull()
    expect(task?.notes).toBeNull()
    expect(typeof task?.createdAt).toBe('number')
  })

  it('generates unique IDs', () => {
    const a = buildTask('one')
    const b = buildTask('two')
    expect(a?.id).not.toBe(b?.id)
  })

  it('trims surrounding whitespace', () => {
    expect(buildTask('  Buy notebook  ')?.title).toBe('Buy notebook')
  })

  it('preserves internal wording and capitalization', () => {
    expect(buildTask('Ask PROFESSOR about  practical')?.title).toBe(
      'Ask PROFESSOR about  practical',
    )
  })

  it('rejects empty and whitespace-only titles', () => {
    expect(buildTask('')).toBeNull()
    expect(buildTask('   ')).toBeNull()
    expect(buildTask('\n\t ')).toBeNull()
  })

  it('rejects non-string input', () => {
    expect(buildTask(null)).toBeNull()
    expect(buildTask(undefined)).toBeNull()
    expect(buildTask(42)).toBeNull()
  })

  it('rejects titles longer than 200 characters without truncating', () => {
    expect(buildTask('x'.repeat(MAX_TITLE_LENGTH + 1))).toBeNull()
    expect(buildTask('x'.repeat(MAX_TITLE_LENGTH))?.title).toHaveLength(
      MAX_TITLE_LENGTH,
    )
  })
})

describe('toggleTask', () => {
  it('flips incomplete to complete and back', () => {
    const tasks = [makeTask('a')]
    const done = toggleTask(tasks, 'a')
    expect(done[0]?.done).toBe(true)
    expect(toggleTask(done, 'a')[0]?.done).toBe(false)
  })

  it('targets only the matching task and preserves all other fields', () => {
    const target = makeTask('a', {
      title: 'keep me',
      createdAt: 5,
      dueDate: '2026-10-01',
      area: 'college',
      notes: 'note',
    })
    const other = makeTask('b')
    const next = toggleTask([target, other], 'a', 1234)
    expect(next[0]).toEqual({ ...target, done: true, doneAt: 1234 })
    expect(next[1]).toBe(other)
  })

  /* --- M6: doneAt powers the daily completion counts --- */

  it('stamps doneAt when completing and clears it when un-completing', () => {
    const done = toggleTask([makeTask('a')], 'a', 555)
    expect(done[0]?.doneAt).toBe(555)
    expect(toggleTask(done, 'a', 999)[0]?.doneAt).toBeNull()
  })

  it('does not mutate the original task when stamping doneAt', () => {
    const target = makeTask('a')
    toggleTask([target], 'a', 777)
    expect(target.doneAt).toBeNull()
  })

  it('does not mutate the original array or task', () => {
    const tasks = [makeTask('a')]
    const snapshot = structuredClone(tasks)
    toggleTask(tasks, 'a')
    expect(tasks).toEqual(snapshot)
  })

  it('leaves the collection unchanged for an unknown id', () => {
    const tasks = [makeTask('a')]
    expect(toggleTask(tasks, 'missing')).toEqual(tasks)
  })
})

describe('renameTask', () => {
  it('renames with trimming and preserves every other field', () => {
    const task = makeTask('a', {
      done: true,
      createdAt: 7,
      dueDate: '2026-10-01',
      area: 'learning',
      notes: 'note',
    })
    const next = renameTask([task], 'a', '  New TITLE  ')
    expect(next?.[0]).toEqual({ ...task, title: 'New TITLE' })
  })

  it('rejects empty, whitespace-only, and overlong titles', () => {
    const tasks = [makeTask('a')]
    expect(renameTask(tasks, 'a', '')).toBeNull()
    expect(renameTask(tasks, 'a', '   ')).toBeNull()
    expect(renameTask(tasks, 'a', 'x'.repeat(MAX_TITLE_LENGTH + 1))).toBeNull()
  })

  it('returns null for an unknown id', () => {
    expect(renameTask([makeTask('a')], 'missing', 'ok')).toBeNull()
  })

  it('leaves other tasks untouched', () => {
    const other = makeTask('b')
    const next = renameTask([makeTask('a'), other], 'a', 'renamed')
    expect(next?.[1]).toBe(other)
  })
})

describe('deleteTask', () => {
  it('removes exactly the matching task', () => {
    const tasks = [makeTask('a'), makeTask('b'), makeTask('c')]
    const next = deleteTask(tasks, 'b')
    expect(next.map((t) => t.id)).toEqual(['a', 'c'])
  })

  it('preserves the remaining task objects', () => {
    const keep = makeTask('a')
    const next = deleteTask([keep, makeTask('b')], 'b')
    expect(next).toEqual([keep])
    expect(next[0]).toBe(keep)
  })

  it('does not mutate the original array', () => {
    const tasks = [makeTask('a'), makeTask('b')]
    deleteTask(tasks, 'a')
    expect(tasks).toHaveLength(2)
  })

  it('leaves the collection unchanged for an unknown id', () => {
    const tasks = [makeTask('a')]
    expect(deleteTask(tasks, 'missing')).toEqual(tasks)
  })
})

describe('buildTask with organization', () => {
  it('creates a task with area and due date', () => {
    const task = buildTask('Study', {
      area: 'college',
      dueDate: '2026-10-01',
    })
    expect(task?.area).toBe('college')
    expect(task?.dueDate).toBe('2026-10-01')
    expect(task?.done).toBe(false)
    expect(task?.notes).toBeNull()
  })

  it('defaults area and due date to null', () => {
    const task = buildTask('Study')
    expect(task?.area).toBeNull()
    expect(task?.dueDate).toBeNull()
  })

  it('rejects invalid area and date values', () => {
    expect(
      buildTask('Study', { area: 'work' as never, dueDate: null }),
    ).toBeNull()
    expect(
      buildTask('Study', { area: null, dueDate: 'tomorrow' }),
    ).toBeNull()
  })

  it('still rejects invalid titles with organization present', () => {
    expect(
      buildTask('   ', { area: 'college', dueDate: '2026-10-01' }),
    ).toBeNull()
  })
})

describe('updateTask', () => {
  it('updates title, area, and due date together', () => {
    const task = makeTask('a')
    const next = updateTask([task], 'a', {
      title: '  Renamed  ',
      area: 'projects',
      dueDate: '2026-10-02',
    })
    expect(next?.[0]).toEqual({
      ...task,
      title: 'Renamed',
      area: 'projects',
      dueDate: '2026-10-02',
    })
  })

  it('clears area and due date', () => {
    const task = makeTask('a', { area: 'college', dueDate: '2026-10-01' })
    const next = updateTask([task], 'a', {
      title: task.title,
      area: null,
      dueDate: null,
    })
    expect(next?.[0]).toEqual({ ...task, area: null, dueDate: null })
  })

  it('preserves done, createdAt, id, and notes', () => {
    const task = makeTask('a', {
      done: true,
      createdAt: 42,
      notes: 'keep',
    })
    const next = updateTask([task], 'a', {
      title: 'new',
      area: 'ideas',
      dueDate: '2026-11-01',
    })
    expect(next?.[0]).toEqual({
      ...task,
      title: 'new',
      area: 'ideas',
      dueDate: '2026-11-01',
    })
  })

  it('returns null for invalid title, area, date, or unknown id', () => {
    const tasks = [makeTask('a')]
    expect(
      updateTask(tasks, 'a', { title: '  ', area: null, dueDate: null }),
    ).toBeNull()
    expect(
      updateTask(tasks, 'a', {
        title: 'ok',
        area: 'work' as never,
        dueDate: null,
      }),
    ).toBeNull()
    expect(
      updateTask(tasks, 'a', {
        title: 'ok',
        area: null,
        dueDate: 'yesterday-ish',
      }),
    ).toBeNull()
    expect(
      updateTask(tasks, 'missing', {
        title: 'ok',
        area: null,
        dueDate: null,
      }),
    ).toBeNull()
  })

  it('does not mutate the input', () => {
    const tasks = [makeTask('a')]
    const snapshot = structuredClone(tasks)
    updateTask(tasks, 'a', {
      title: 'new',
      area: 'personal',
      dueDate: '2026-10-03',
    })
    expect(tasks).toEqual(snapshot)
  })
})

describe('moveTaskToToday (Inbox swipe)', () => {
  const TODAY = '2026-09-25'

  it('schedules an undated Inbox task for today, keeping other fields', () => {
    const task = makeTask('a', { area: 'college', notes: 'keep' })
    const next = moveTaskToToday([task], 'a', TODAY)
    expect(next?.[0]).toEqual({ ...task, dueDate: TODAY })
  })

  it('leaves priority unranked so the user ranks it in Today', () => {
    const task = makeTask('a', { priorityOrder: null })
    expect(moveTaskToToday([task], 'a', TODAY)?.[0]?.priorityOrder).toBeNull()
  })

  it('rejects done tasks, dated tasks, unknown ids, and bad dates', () => {
    const done = makeTask('d', { done: true })
    const dated = makeTask('t', { dueDate: TODAY })
    const inbox = makeTask('i')
    expect(moveTaskToToday([done], 'd', TODAY)).toBeNull()
    expect(moveTaskToToday([dated], 't', TODAY)).toBeNull()
    expect(moveTaskToToday([inbox], 'missing', TODAY)).toBeNull()
    expect(moveTaskToToday([inbox], 'i', 'tomorrow')).toBeNull()
  })

  it('does not mutate the input', () => {
    const tasks = [makeTask('a')]
    const snapshot = structuredClone(tasks)
    moveTaskToToday(tasks, 'a', TODAY)
    expect(tasks).toEqual(snapshot)
  })
})

describe('repeats (daily + weekly)', () => {
  const TODAY = '2026-10-13'

  it('validates repeat values', () => {
    expect(isRepeat('daily')).toBe(true)
    expect(isRepeat('weekly')).toBe(true)
    expect(isRepeat(null)).toBe(false)
    expect(isRepeat('monthly')).toBe(false)
    expect(isRepeat(undefined)).toBe(false)
  })

  it('defaults new tasks to one-off with no chain', () => {
    expect(buildTask('Study physics')?.repeat).toBeNull()
    expect(buildTask('Study physics')?.repeatGroupId).toBeNull()
  })

  it('starts a new chain when built with a repeat', () => {
    const task = buildTask('Gym', { dueDate: TODAY, repeat: 'daily' })
    expect(task?.repeat).toBe('daily')
    expect(task?.repeatGroupId).toBe(task?.id)
  })

  it('rejects invalid repeat values', () => {
    expect(
      buildTask('Study', { dueDate: TODAY, repeat: 'monthly' as never }),
    ).toBeNull()
  })

  it('computes tomorrow for an on-time daily', () => {
    expect(nextRepeatDueDate(TODAY, 'daily', TODAY)).toBe('2026-10-14')
  })

  it('computes same weekday next week for an on-time weekly', () => {
    expect(nextRepeatDueDate(TODAY, 'weekly', TODAY)).toBe('2026-10-20')
  })

  it('rolls a missed daily forward to tomorrow, not into the past', () => {
    expect(nextRepeatDueDate('2026-10-10', 'daily', TODAY)).toBe('2026-10-14')
  })

  it('keeps the weekday when a weekly was missed', () => {
    // Due Monday Oct 6, today Monday Oct 13 -> next Monday Oct 20.
    expect(nextRepeatDueDate('2026-10-06', 'weekly', TODAY)).toBe('2026-10-20')
  })

  it('builds the next instance copying content but clearing done and rank', () => {
    const completed = makeTask('a', {
      title: 'Read 10 pages',
      area: 'learning',
      notes: 'keep',
      dueDate: TODAY,
      repeat: 'daily',
      repeatGroupId: 'a',
      priorityOrder: 1,
    })
    const next = buildNextRepeatInstance(completed, TODAY, 999)
    expect(next).not.toBeNull()
    expect(next?.title).toBe('Read 10 pages')
    expect(next?.area).toBe('learning')
    expect(next?.notes).toBe('keep')
    expect(next?.repeat).toBe('daily')
    expect(next?.repeatGroupId).toBe('a')
    expect(next?.done).toBe(false)
    expect(next?.doneAt).toBeNull()
    expect(next?.priorityOrder).toBeNull()
    expect(next?.dueDate).toBe('2026-10-14')
    expect(next?.id).not.toBe('a')
  })

  it('returns null for one-off tasks', () => {
    expect(buildNextRepeatInstance(makeTask('a'), TODAY)).toBeNull()
  })

  it('spawns tomorrow on completing a daily', () => {
    const task = makeTask('a', {
      dueDate: TODAY,
      repeat: 'daily',
      repeatGroupId: 'a',
    })
    const next = toggleTaskWithRepeat([task], 'a', TODAY, 555)
    expect(next).toHaveLength(2)
    const done = next.find((t) => t.id === 'a')
    const spawn = next.find((t) => t.id !== 'a')
    expect(done?.done).toBe(true)
    expect(spawn?.done).toBe(false)
    expect(spawn?.dueDate).toBe('2026-10-14')
    expect(spawn?.repeat).toBe('daily')
    expect(spawn?.repeatGroupId).toBe('a')
  })

  it('does not spawn when reopening a repeat', () => {
    const task = makeTask('a', {
      done: true,
      doneAt: 1,
      dueDate: TODAY,
      repeat: 'daily',
      repeatGroupId: 'a',
    })
    const next = toggleTaskWithRepeat([task], 'a', TODAY, 555)
    expect(next).toHaveLength(1)
    expect(next[0]?.done).toBe(false)
  })

  it('does not duplicate when today already has an open instance', () => {
    const overdue = makeTask('old', {
      dueDate: '2026-10-10',
      repeat: 'daily',
      repeatGroupId: 'g',
    })
    const todayOpen = makeTask('today', {
      dueDate: TODAY,
      repeat: 'daily',
      repeatGroupId: 'g',
    })
    expect(hasOpenRepeatInstance([overdue, todayOpen], 'g', 'old', TODAY)).toBe(
      true,
    )
    const next = toggleTaskWithRepeat([overdue, todayOpen], 'old', TODAY, 555)
    // Overdue marked done, no third instance created.
    expect(next).toHaveLength(2)
    expect(next.find((t) => t.id === 'old')?.done).toBe(true)
  })

  it('turning repeat on starts a chain; turning it off breaks the link', () => {
    const oneOff = makeTask('a', { dueDate: TODAY })
    const on = updateTask([oneOff], 'a', {
      title: oneOff.title,
      area: null,
      dueDate: TODAY,
      repeat: 'weekly',
    })
    expect(on?.[0]?.repeat).toBe('weekly')
    expect(on?.[0]?.repeatGroupId).toBe('a')
    const off = updateTask(on ?? [], 'a', {
      title: oneOff.title,
      area: null,
      dueDate: TODAY,
      repeat: null,
    })
    expect(off?.[0]?.repeat).toBeNull()
    expect(off?.[0]?.repeatGroupId).toBeNull()
  })

  it('defaults an undated repeat to today on edit', () => {
    const inbox = makeTask('a', { dueDate: null })
    const next = updateTask(
      [inbox],
      'a',
      { title: inbox.title, area: null, dueDate: null, repeat: 'daily' },
      TODAY,
    )
    expect(next?.[0]?.dueDate).toBe(TODAY)
    expect(next?.[0]?.repeat).toBe('daily')
  })

  it('leaves one-off tasks untouched on toggle', () => {
    const tasks = [makeTask('a', { dueDate: TODAY })]
    expect(toggleTaskWithRepeat(tasks, 'a', TODAY, 1)).toHaveLength(1)
  })
})

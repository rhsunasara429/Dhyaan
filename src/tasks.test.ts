import { describe, expect, it } from 'vitest'
import {
  buildTask,
  deleteTask,
  MAX_TITLE_LENGTH,
  renameTask,
  toggleTask,
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

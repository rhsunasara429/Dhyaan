import { describe, expect, it } from 'vitest'
import { buildTask, MAX_TITLE_LENGTH } from './tasks.ts'

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

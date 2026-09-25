import type { Area, Task } from './types.ts'

export const MAX_TITLE_LENGTH = 200

export const AREAS: readonly Area[] = [
  'college',
  'learning',
  'projects',
  'personal',
  'ideas',
]

const DUE_DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

export function isArea(value: unknown): value is Area {
  return (
    typeof value === 'string' &&
    (AREAS as readonly string[]).includes(value)
  )
}

export function isDueDate(value: unknown): value is string {
  return typeof value === 'string' && DUE_DATE_PATTERN.test(value)
}

export function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false
  const t = value as Record<string, unknown>
  return (
    typeof t.id === 'string' &&
    t.id.length > 0 &&
    typeof t.title === 'string' &&
    t.title.length > 0 &&
    t.title.length <= MAX_TITLE_LENGTH &&
    typeof t.done === 'boolean' &&
    typeof t.createdAt === 'number' &&
    Number.isFinite(t.createdAt) &&
    (t.dueDate === null || isDueDate(t.dueDate)) &&
    (t.area === null || isArea(t.area)) &&
    (t.notes === null || typeof t.notes === 'string')
  )
}

export function buildTask(title: unknown): Task | null {
  if (typeof title !== 'string') return null
  const trimmed = title.trim()
  if (trimmed.length === 0 || trimmed.length > MAX_TITLE_LENGTH) return null
  return {
    id: crypto.randomUUID(),
    title: trimmed,
    done: false,
    createdAt: Date.now(),
    dueDate: null,
    area: null,
    notes: null,
  }
}

function validateTitle(title: unknown): string | null {
  if (typeof title !== 'string') return null
  const trimmed = title.trim()
  if (trimmed.length === 0 || trimmed.length > MAX_TITLE_LENGTH) return null
  return trimmed
}

export function toggleTask(tasks: Task[], id: string): Task[] {
  return tasks.map((task) =>
    task.id === id ? { ...task, done: !task.done } : task,
  )
}

export function renameTask(
  tasks: Task[],
  id: string,
  title: unknown,
): Task[] | null {
  const trimmed = validateTitle(title)
  if (trimmed === null) return null
  let found = false
  const next = tasks.map((task) => {
    if (task.id !== id) return task
    found = true
    return { ...task, title: trimmed }
  })
  return found ? next : null
}

export function deleteTask(tasks: Task[], id: string): Task[] {
  return tasks.filter((task) => task.id !== id)
}

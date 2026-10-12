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

export function isPriorityOrder(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1
  )
}

export function normalizePriorityOrder(value: unknown): number | null {
  return isPriorityOrder(value) ? value : null
}

function isDoneAt(value: unknown): boolean {
  // Absent means the task predates the field (M6); storage.loadTasks fills it
  // in. Rejecting `undefined` here would silently drop every stored task.
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'number' && Number.isFinite(value))
  )
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
    isDoneAt(t.doneAt) &&
    typeof t.createdAt === 'number' &&
    Number.isFinite(t.createdAt) &&
    (t.dueDate === null || isDueDate(t.dueDate)) &&
    (t.area === null || isArea(t.area)) &&
    (t.notes === null || typeof t.notes === 'string')
    // priorityOrder is intentionally not validated here: tasks stored before
    // the field existed carry no key, and invalid values must fall back to
    // null in storage.loadTasks instead of dropping the task. Same for the
    // legacy `priority` ('important' | 'normal') string.
  )
}

export type TaskInit = {
  area?: Area | null
  dueDate?: string | null
}

export type TaskOrganization = {
  area: Area | null
  dueDate: string | null
}

export function buildTask(title: unknown, init?: TaskInit): Task | null {
  if (typeof title !== 'string') return null
  const trimmed = title.trim()
  if (trimmed.length === 0 || trimmed.length > MAX_TITLE_LENGTH) return null
  const area = init?.area ?? null
  const dueDate = init?.dueDate ?? null
  if (area !== null && !isArea(area)) return null
  if (dueDate !== null && !isDueDate(dueDate)) return null
  return {
    id: crypto.randomUUID(),
    title: trimmed,
    done: false,
    doneAt: null,
    createdAt: Date.now(),
    dueDate,
    area,
    notes: null,
    priorityOrder: null,
  }
}

function validateTitle(title: unknown): string | null {
  if (typeof title !== 'string') return null
  const trimmed = title.trim()
  if (trimmed.length === 0 || trimmed.length > MAX_TITLE_LENGTH) return null
  return trimmed
}

function maxPriorityOrder(tasks: Task[]): number {
  let max = 0
  for (const task of tasks) {
    if (task.priorityOrder !== null && task.priorityOrder > max) {
      max = task.priorityOrder
    }
  }
  return max
}

export function toggleTask(
  tasks: Task[],
  id: string,
  now: number = Date.now(),
): Task[] {
  const target = tasks.find((task) => task.id === id)
  if (target === undefined) return tasks
  const done = !target.done
  if (!done) {
    // Reopening never assigns a rank; a task cleared on completion comes back
    // unranked.
    return tasks.map((task) => {
      if (task.id !== id) return task
      return { ...task, done, doneAt: null }
    })
  }
  // Completing a ranked task clears its rank and shifts higher ranks up so
  // P-numbers stay contiguous (P1, P2, ... with no gaps).
  const removedRank = target.priorityOrder
  if (removedRank === null) {
    return tasks.map((task) => {
      if (task.id !== id) return task
      return { ...task, done, doneAt: now }
    })
  }
  return tasks.map((task) => {
    if (task.id !== id) {
      if (
        task.priorityOrder !== null &&
        task.priorityOrder > removedRank
      ) {
        return { ...task, priorityOrder: task.priorityOrder - 1 }
      }
      return task
    }
    return { ...task, done, doneAt: now, priorityOrder: null }
  })
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
  const target = tasks.find((task) => task.id === id)
  if (target === undefined) return tasks.filter((task) => task.id !== id)
  const removedRank = target.priorityOrder
  const remaining = tasks.filter((task) => task.id !== id)
  if (removedRank === null) return remaining
  return remaining.map((task) =>
    task.priorityOrder !== null && task.priorityOrder > removedRank
      ? { ...task, priorityOrder: task.priorityOrder - 1 }
      : task,
  )
}

export function updateTask(
  tasks: Task[],
  id: string,
  patch: { title: unknown } & TaskOrganization,
): Task[] | null {
  const trimmed = validateTitle(patch.title)
  if (trimmed === null) return null
  if (patch.area !== null && !isArea(patch.area)) return null
  if (patch.dueDate !== null && !isDueDate(patch.dueDate)) return null
  let found = false
  const next = tasks.map((task) => {
    if (task.id !== id) return task
    found = true
    return {
      ...task,
      title: trimmed,
      area: patch.area,
      dueDate: patch.dueDate,
    }
  })
  return found ? next : null
}

/**
 * Star-click ranking: the first star click assigns P1, the next unranked star
 * click assigns P2, and so on. Re-clicking (starring) a ranked task clears it
 * and shifts higher ranks up.
 */
export function togglePriorityOrder(
  tasks: Task[],
  id: string,
): Task[] | null {
  const target = tasks.find((task) => task.id === id)
  if (target === undefined) return null
  if (target.priorityOrder !== null) {
    const removedRank = target.priorityOrder
    return tasks.map((task) => {
      if (task.id === id) return { ...task, priorityOrder: null }
      if (
        task.priorityOrder !== null &&
        task.priorityOrder > removedRank
      ) {
        return { ...task, priorityOrder: task.priorityOrder - 1 }
      }
      return task
    })
  }
  const nextRank = maxPriorityOrder(tasks) + 1
  return tasks.map((task) =>
    task.id === id ? { ...task, priorityOrder: nextRank } : task,
  )
}

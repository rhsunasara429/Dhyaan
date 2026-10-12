import type { Area, Task, TaskPriority } from './types.ts'

export const MAX_TITLE_LENGTH = 200

export const TASK_PRIORITIES: readonly TaskPriority[] = [
  'important',
  'normal',
]

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

export function isTaskPriority(value: unknown): value is TaskPriority {
  return value === 'important' || value === 'normal'
}

export function normalizePriority(value: unknown): TaskPriority {
  return value === 'important' ? 'important' : 'normal'
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
    // Priority is intentionally not validated here: tasks stored before the
    // field existed carry no key, and invalid values must fall back to
    // 'normal' in storage.loadTasks instead of dropping the task.
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
    priority: 'normal',
  }
}

function validateTitle(title: unknown): string | null {
  if (typeof title !== 'string') return null
  const trimmed = title.trim()
  if (trimmed.length === 0 || trimmed.length > MAX_TITLE_LENGTH) return null
  return trimmed
}

export function toggleTask(
  tasks: Task[],
  id: string,
  now: number = Date.now(),
): Task[] {
  return tasks.map((task) => {
    if (task.id !== id) return task
    const done = !task.done
    return { ...task, done, doneAt: done ? now : null }
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
  return tasks.filter((task) => task.id !== id)
}

export function updateTask(
  tasks: Task[],
  id: string,
  patch: { title: unknown } & TaskOrganization & { priority?: unknown },
): Task[] | null {
  const trimmed = validateTitle(patch.title)
  if (trimmed === null) return null
  if (patch.area !== null && !isArea(patch.area)) return null
  if (patch.dueDate !== null && !isDueDate(patch.dueDate)) return null
  let nextPriority: TaskPriority | null = null
  let changePriority = false
  if (patch.priority !== undefined) {
    if (!isTaskPriority(patch.priority)) return null
    changePriority = true
    nextPriority = patch.priority
  }
  let found = false
  const next = tasks.map((task) => {
    if (task.id !== id) return task
    found = true
    return {
      ...task,
      title: trimmed,
      area: patch.area,
      dueDate: patch.dueDate,
      priority: changePriority ? (nextPriority as TaskPriority) : task.priority ?? 'normal',
    }
  })
  return found ? next : null
}

export function setTaskPriority(
  tasks: Task[],
  id: string,
  priority: unknown,
): Task[] | null {
  if (!isTaskPriority(priority)) return null
  let found = false
  const next = tasks.map((task) => {
    if (task.id !== id) return task
    found = true
    if (task.priority === priority) return task
    return { ...task, priority }
  })
  return found ? next : null
}

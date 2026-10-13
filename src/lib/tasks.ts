import { addDaysLocal } from './dates.ts'
import type { Area, Repeat, Task } from './types.ts'

export const MAX_TITLE_LENGTH = 200

export const AREAS: readonly Area[] = [
  'college',
  'learning',
  'projects',
  'personal',
  'ideas',
]

export const REPEATS: readonly Repeat[] = ['daily', 'weekly']

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

export function isRepeat(value: unknown): value is Repeat {
  return (
    value === 'daily' ||
    value === 'weekly'
  )
}

export function normalizeRepeat(value: unknown): Repeat | null {
  return isRepeat(value) ? value : null
}

export function normalizeRepeatGroupId(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
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
    // priorityOrder, repeat, and repeatGroupId are intentionally not
    // validated here: tasks stored before the fields existed carry no key,
    // and invalid values must fall back (null / one-off) in
    // storage.loadTasks instead of dropping the task. Same for the legacy
    // `priority` ('important' | 'normal') string.
  )
}

export type TaskInit = {
  area?: Area | null
  dueDate?: string | null
  repeat?: Repeat | null
}

export type TaskOrganization = {
  area: Area | null
  dueDate: string | null
  repeat: Repeat | null
}

export function buildTask(title: unknown, init?: TaskInit): Task | null {
  if (typeof title !== 'string') return null
  const trimmed = title.trim()
  if (trimmed.length === 0 || trimmed.length > MAX_TITLE_LENGTH) return null
  const area = init?.area ?? null
  const dueDate = init?.dueDate ?? null
  const repeat = init?.repeat ?? null
  if (area !== null && !isArea(area)) return null
  if (dueDate !== null && !isDueDate(dueDate)) return null
  if (repeat !== null && !isRepeat(repeat)) return null
  const id = crypto.randomUUID()
  return {
    id,
    title: trimmed,
    done: false,
    doneAt: null,
    createdAt: Date.now(),
    dueDate,
    area,
    notes: null,
    priorityOrder: null,
    repeat,
    // A new repeating task starts its own chain; spawns inherit this id.
    repeatGroupId: repeat !== null ? id : null,
  }
}

function validateTitle(title: unknown): string | null {
  if (typeof title !== 'string') return null
  const trimmed = title.trim()
  if (trimmed.length === 0 || trimmed.length > MAX_TITLE_LENGTH) return null
  return trimmed
}

/**
 * Priority is only meaningful for Today work: open tasks due today or
 * overdue (dueDate <= today). Inbox (undated), Upcoming (future), and
 * completed tasks can never hold a rank — the UI hides the control there
 * and edits/moves auto-clear it (see clearIneligibleRanks).
 */
export function canPrioritizeTask(task: Task, today: string): boolean {
  return !task.done && task.dueDate !== null && task.dueDate <= today
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

/**
 * Clear ranks that are no longer eligible (Inbox / Upcoming / done) and
 * compact the survivors to a contiguous P1..Pn sequence, preserving rank
 * order. Returns a new array; the input is never mutated.
 */
export function clearIneligibleRanks(tasks: Task[], today: string): Task[] {
  const eligible = tasks.filter(
    (task) => task.priorityOrder !== null && canPrioritizeTask(task, today),
  )
  if (eligible.length === tasks.filter((t) => t.priorityOrder !== null).length) {
    return tasks
  }
  const order = new Map<string, number>()
  ;[...eligible]
    .sort(
      (a, b) =>
        (a.priorityOrder as number) - (b.priorityOrder as number) ||
        b.createdAt - a.createdAt,
    )
    .forEach((task, index) => {
      order.set(task.id, index + 1)
    })
  return tasks.map((task) => {
    if (task.priorityOrder === null) return task
    if (!order.has(task.id)) return { ...task, priorityOrder: null }
    const next = order.get(task.id) as number
    return task.priorityOrder === next ? task : { ...task, priorityOrder: next }
  })
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
  patch: { title: unknown; area?: Area | null; dueDate?: string | null; repeat?: Repeat | null } & Partial<TaskOrganization>,
  today?: string,
): Task[] | null {
  const trimmed = validateTitle(patch.title)
  if (trimmed === null) return null
  // area / dueDate / repeat are optional for backward compatibility:
  // omitted means "keep existing". Explicit null clears.
  const patchHasArea = patch.area !== undefined
  const patchHasDue = patch.dueDate !== undefined
  const patchHasRepeat = patch.repeat !== undefined
  if (patchHasArea && patch.area !== null && !isArea(patch.area)) return null
  if (patchHasDue && patch.dueDate !== null && !isDueDate(patch.dueDate)) return null
  if (patchHasRepeat && patch.repeat !== null && !isRepeat(patch.repeat)) return null
  let found = false
  let removedRank: number | null = null
  const next = tasks.map((task) => {
    if (task.id !== id) return task
    found = true
    const nextArea = patchHasArea ? (patch.area as Area | null) : task.area
    let nextDue = patchHasDue ? (patch.dueDate as string | null) : task.dueDate
    let nextRepeat: Repeat | null = patchHasRepeat
      ? (patch.repeat as Repeat | null)
      : (task.repeat ?? null)
    let nextGroup: string | null = task.repeatGroupId ?? null
    if (patchHasRepeat) {
      if (nextRepeat === null) {
        // Turning repeat off breaks the chain link.
        nextGroup = null
      } else if (nextGroup === null) {
        // Turning repeat on for an old one-off starts a new chain.
        nextGroup = task.id
      }
    } else if (nextRepeat !== null && nextGroup === null) {
      // Heal legacy rows that carry a repeat but no group.
      nextGroup = task.id
    }
    // A repeating task is meaningless without a date (it would sit in Inbox
    // forever). Default it to today when the caller knows today.
    if (nextRepeat !== null && nextDue === null && today !== undefined) {
      nextDue = today
    }
    const merged: Task = {
      ...task,
      title: trimmed,
      area: nextArea,
      dueDate: nextDue,
      repeat: nextRepeat,
      repeatGroupId: nextGroup,
    }
    // Moving a task out of Today (Inbox / Upcoming) auto-clears its rank so
    // a stale P-number can never linger where priority is not allowed.
    if (
      today !== undefined &&
      task.priorityOrder !== null &&
      !canPrioritizeTask(merged, today)
    ) {
      removedRank = task.priorityOrder
      return { ...merged, priorityOrder: null }
    }
    return merged
  })
  if (!found) return null
  if (removedRank === null) return next
  const rank = removedRank as number
  return next.map((task) =>
    task.priorityOrder !== null && task.priorityOrder > rank
      ? { ...task, priorityOrder: task.priorityOrder - 1 }
      : task,
  )
}

/**
 * Inbox right-swipe: schedule an undated, open task for today. Only Inbox
 * tasks qualify (done or already-dated tasks are rejected with null) so the
 * gesture can never steal the Complete/Reopen meaning in other sections.
 * Priority stays null — the user ranks it in Today afterwards if wanted.
 */
export function moveTaskToToday(
  tasks: Task[],
  id: string,
  today: string,
): Task[] | null {
  if (!isDueDate(today)) return null
  const target = tasks.find((task) => task.id === id)
  if (target === undefined) return null
  if (target.done || target.dueDate !== null) return null
  return tasks.map((task) =>
    task.id === id ? { ...task, dueDate: today } : task,
  )
}

/**
 * Star-click ranking: the first star click assigns P1, the next unranked star
 * click assigns P2, and so on. Re-clicking (starring) a ranked task clears it
 * and shifts higher ranks up. When `today` is given, Inbox / Upcoming / done
 * tasks are rejected (null) so priority can only be set on Today work.
 */
export function togglePriorityOrder(
  tasks: Task[],
  id: string,
  today?: string,
): Task[] | null {
  const target = tasks.find((task) => task.id === id)
  if (target === undefined) return null
  if (today !== undefined && !canPrioritizeTask(target, today)) return null
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
  const pool =
    today === undefined
      ? tasks
      : tasks.filter((task) => canPrioritizeTask(task, today))
  const nextRank = maxPriorityOrder(pool) + 1
  return tasks.map((task) =>
    task.id === id ? { ...task, priorityOrder: nextRank } : task,
  )
}

/* ---- Repeats: daily + weekly (self-replicating chains) ----
   Completing a repeating task never resets it — history (doneAt, streaks,
   daily progress) stays on the done instance and a fresh open instance is
   spawned for the next date. Generation happens only on completion, so no
   background job or alarm is needed (localStorage-only, like the M7
   reminder catch-up): missed tasks simply wait as Overdue. */

function repeatStepDays(repeat: Repeat): number {
  return repeat === 'daily' ? 1 : 7
}

/**
 * Next due date strictly after `today`, rolling forward from `fromDueDate`.
 * Weekly keeps its weekday (due + 7k); daily lands on tomorrow. An undated
 * or invalid start is treated as today, so the result is still > today.
 */
export function nextRepeatDueDate(
  fromDueDate: string | null,
  repeat: Repeat,
  today: string,
): string {
  const step = repeatStepDays(repeat)
  let cursor =
    fromDueDate !== null && isDueDate(fromDueDate) ? fromDueDate : today
  // Bound the loop: even a year of missed dailies converges in < 370 steps.
  for (let i = 0; i < 1000; i++) {
    cursor = addDaysLocal(cursor, step)
    if (cursor > today) return cursor
  }
  return addDaysLocal(today, step)
}

/** A chain is identified by its group's id. Spawns inherit it. */
export function repeatChainId(task: Task): string | null {
  if ((task.repeat ?? null) === null) return null
  return task.repeatGroupId ?? task.id
}

/**
 * True when another open instance of the same chain already covers today or
 * the future. Completing an overdue instance must not duplicate it.
 */
export function hasOpenRepeatInstance(
  tasks: Task[],
  groupId: string,
  excludeId: string,
  today?: string,
): boolean {
  return tasks.some((task) => {
    if (task.id === excludeId) return false
    if (task.done) return false
    if ((task.repeat ?? null) === null) return false
    if ((task.repeatGroupId ?? task.id) !== groupId) return false
    if (today !== undefined && task.dueDate !== null && task.dueDate < today) {
      return false
    }
    return true
  })
}

/**
 * Build the next open instance for a just-completed repeating task.
 * Returns null for one-off tasks. Copies title / area / notes / repeat,
 * clears done / rank, and dates it strictly after `today`.
 */
export function buildNextRepeatInstance(
  completed: Task,
  today: string,
  now: number = Date.now(),
): Task | null {
  const repeat = completed.repeat ?? null
  if (repeat === null) return null
  if (!isDueDate(today)) return null
  const groupId = completed.repeatGroupId ?? completed.id
  return {
    id: crypto.randomUUID(),
    title: completed.title,
    done: false,
    doneAt: null,
    createdAt: now,
    dueDate: nextRepeatDueDate(completed.dueDate, repeat, today),
    area: completed.area,
    notes: completed.notes,
    priorityOrder: null,
    repeat,
    repeatGroupId: groupId,
  }
}

/**
 * Toggle + repeat-spawn in one atomic step so the UI (and StrictMode
 * double-invoke) can never create two spawns for one completion. Reopening
 * never spawns; completing a repeat spawns only when no open instance of
 * the same chain already covers today-or-later.
 */
export function toggleTaskWithRepeat(
  tasks: Task[],
  id: string,
  today: string,
  now: number = Date.now(),
): Task[] {
  const target = tasks.find((task) => task.id === id)
  if (target === undefined) return tasks
  const completing = !target.done
  const toggled = toggleTask(tasks, id, now)
  if (!completing) return toggled
  if ((target.repeat ?? null) === null) return toggled
  if (!isDueDate(today)) return toggled
  const groupId = target.repeatGroupId ?? target.id
  if (hasOpenRepeatInstance(toggled, groupId, id, today)) return toggled
  const next = buildNextRepeatInstance(target, today, now)
  if (next === null) return toggled
  return [next, ...toggled]
}

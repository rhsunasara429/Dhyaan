import { clearIneligibleRanks, isTask, normalizePriorityOrder, normalizeRepeat, normalizeRepeatGroupId } from './tasks.ts'
import type { Task } from './types.ts'

export const STORAGE_KEY = 'dhyaan.tasks.v1'

export type TaskStore = Pick<Storage, 'getItem' | 'setItem'>

function defaultStore(): TaskStore | null {
  try {
    if (typeof globalThis.localStorage !== 'undefined') {
      return globalThis.localStorage
    }
    return null
  } catch {
    return null
  }
}

function isLegacyImportant(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  return (value as Record<string, unknown>).priority === 'important'
}

export function loadTasks(
  store: TaskStore | null = defaultStore(),
  today?: string,
): Task[] {
  if (store === null) return []
  let raw: string | null
  try {
    raw = store.getItem(STORAGE_KEY)
  } catch {
    return []
  }
  if (raw === null || raw === '') return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  // Backward-compatible migration: tasks stored before `doneAt` existed (M6)
  // carry no such key. isTask tolerates the absence, so normalise here instead
  // of bumping STORAGE_KEY, which would orphan every existing task.
  // Same for priority: `priorityOrder` (P1, P2, ...) replaces the legacy
  // `priority` ('important' | 'normal') string. Missing or invalid values
  // fall back to null (unranked); legacy 'important' tasks are appended after
  // existing ranks, newest first, so previous Important-first order is kept.
  type RankedSeed = { task: Task; legacyImportant: boolean }
  const seeds: RankedSeed[] = []
  for (const entry of parsed) {
    if (!isTask(entry)) continue
    const record = entry as Record<string, unknown>
    const { priority: _legacy, ...rest } = record
    const base = rest as unknown as Task
    // Forward-compatible repeat migration: tasks stored before repeats
    // existed carry no keys (isTask tolerates the absence). Invalid values
    // fall back to one-off instead of dropping the task — same rule as
    // priorityOrder. A repeat without a group adopts its own id as the
    // chain; a one-off never keeps a stale group link.
    const repeat = normalizeRepeat(record.repeat)
    let repeatGroupId = normalizeRepeatGroupId(record.repeatGroupId)
    if (repeat === null) {
      repeatGroupId = null
    } else if (repeatGroupId === null) {
      const id = typeof base.id === 'string' ? base.id : null
      repeatGroupId = id
    }
    seeds.push({
      task: {
        ...base,
        doneAt: base.doneAt ?? null,
        priorityOrder: normalizePriorityOrder(record.priorityOrder),
        repeat,
        repeatGroupId,
      },
      legacyImportant: isLegacyImportant(entry),
    })
  }

  // Compact existing ranks to 1..N so gaps or duplicates from older builds
  // (or hand-edited storage) cannot leak into the UI.
  const ranked = seeds
    .filter((seed) => seed.task.priorityOrder !== null)
    .sort(
      (a, b) =>
        (a.task.priorityOrder as number) - (b.task.priorityOrder as number) ||
        b.task.createdAt - a.task.createdAt,
    )
  ranked.forEach((seed, index) => {
    seed.task.priorityOrder = index + 1
  })

  // Migrate legacy Important tasks (no valid rank) after existing ranks.
  const legacy = seeds
    .filter(
      (seed) =>
        seed.task.priorityOrder === null && seed.legacyImportant,
    )
    .sort((a, b) => b.task.createdAt - a.task.createdAt)
  legacy.forEach((seed, index) => {
    seed.task.priorityOrder = ranked.length + index + 1
  })

  const loaded = seeds.map((seed) => seed.task)
  // Priority lives only on Today work (Overdue + Due Today). When `today` is
  // known, drop stale ranks from Inbox / Upcoming / done tasks so they can
  // never resurface where the control is hidden.
  if (today === undefined) return loaded
  return clearIneligibleRanks(loaded, today)
}

export function saveTasks(
  tasks: Task[],
  store: TaskStore | null = defaultStore(),
): void {
  if (store === null) return
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch {
    return
  }
}

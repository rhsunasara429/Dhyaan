import { isTask } from './tasks.ts'
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

export function loadTasks(store: TaskStore | null = defaultStore()): Task[] {
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
  return parsed
    .filter(isTask)
    .map((task) => ({ ...task, doneAt: task.doneAt ?? null }))
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

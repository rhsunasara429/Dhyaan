/* Reminder persistence (M7).
 *
 * Stores only which local day the banner was last shown on, so it appears
 * once per day. Defensive shape mirrors storage.ts / noteStorage.ts: any
 * storage failure degrades to "not shown yet", which is the harmless case.
 */

export const REMINDER_STORAGE_KEY = 'dhyaan.reminder.v1'

export type ReminderStore = Pick<Storage, 'getItem' | 'setItem'>

function defaultStore(): ReminderStore | null {
  try {
    if (typeof globalThis.localStorage !== 'undefined') {
      return globalThis.localStorage
    }
    return null
  } catch {
    return null
  }
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function loadShownDay(store: ReminderStore | null = defaultStore()): string | null {
  if (store === null) return null
  let raw: string | null
  try {
    raw = store.getItem(REMINDER_STORAGE_KEY)
  } catch {
    return null
  }
  if (raw === null || raw === '' || !DAY_PATTERN.test(raw)) return null
  return raw
}

export function saveShownDay(
  day: string,
  store: ReminderStore | null = defaultStore(),
): void {
  if (store === null) return
  if (!DAY_PATTERN.test(day)) return
  try {
    store.setItem(REMINDER_STORAGE_KEY, day)
  } catch {
    return
  }
}
export type Area =
  | 'college'
  | 'learning'
  | 'projects'
  | 'personal'
  | 'ideas'

export type Repeat = 'daily' | 'weekly'

export type Task = {
  id: string
  title: string
  done: boolean
  /** Epoch ms of when the task was completed, or null while open.
   *  Added in M6; absent on tasks stored before this field existed. */
  doneAt: number | null
  createdAt: number
  dueDate: string | null
  area: Area | null
  notes: string | null
  /** Click-to-rank order for Today. 1 = first priority (P1), 2 = P2, etc.
   *  Null means unranked. Assigned in star-click order; re-click clears and
   *  shifts higher ranks up. Only Today sections sort by it; Inbox ignores
   *  it. Absent or invalid on older stored tasks, which behave as unranked. */
  priorityOrder: number | null
  /** Repeat cadence. Null means one-off. Absent or invalid on tasks stored
   *  before repeats existed, which behave as one-off (see storage.loadTasks).
   *  Completing a repeating task spawns the next dated instance so history
   *  (doneAt, streaks) is preserved — the task itself is never reset. */
  repeat: Repeat | null
  /** Links instances of one repeat chain. The first instance points at its
   *  own id; spawns inherit it. Null for one-off tasks. Used only as a
   *  duplicate guard when completing an overdue instance while today's
   *  instance already exists. */
  repeatGroupId: string | null
}

export type Note = {
  id: string
  content: string
  createdAt: number
  updatedAt: number
}

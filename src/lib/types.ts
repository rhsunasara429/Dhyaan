export type Area =
  | 'college'
  | 'learning'
  | 'projects'
  | 'personal'
  | 'ideas'

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
}

export type Note = {
  id: string
  content: string
  createdAt: number
  updatedAt: number
}

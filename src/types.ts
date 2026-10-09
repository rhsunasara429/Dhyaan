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
}

export type Note = {
  id: string
  content: string
  createdAt: number
  updatedAt: number
}

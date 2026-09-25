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
  createdAt: number
  dueDate: string | null
  area: Area | null
  notes: string | null
}

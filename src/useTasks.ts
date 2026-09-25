import { useRef, useState } from 'react'
import { loadTasks, saveTasks } from './storage.ts'
import { buildTask } from './tasks.ts'
import type { Task } from './types.ts'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks())
  const tasksRef = useRef(tasks)

  function addTask(title: string): boolean {
    const task = buildTask(title)
    if (task === null) return false
    const next = [task, ...tasksRef.current]
    tasksRef.current = next
    setTasks(next)
    saveTasks(next)
    return true
  }

  return { tasks, addTask }
}

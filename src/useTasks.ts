import { useRef, useState } from 'react'
import { loadTasks, saveTasks } from './storage.ts'
import { buildTask, deleteTask, renameTask, toggleTask } from './tasks.ts'
import type { Task } from './types.ts'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks())
  const tasksRef = useRef(tasks)

  function commit(next: Task[]): void {
    tasksRef.current = next
    setTasks(next)
    saveTasks(next)
  }

  function addTask(title: string): boolean {
    const task = buildTask(title)
    if (task === null) return false
    commit([task, ...tasksRef.current])
    return true
  }

  function toggleTaskById(id: string): void {
    commit(toggleTask(tasksRef.current, id))
  }

  function renameTaskById(id: string, title: string): boolean {
    const next = renameTask(tasksRef.current, id, title)
    if (next === null) return false
    commit(next)
    return true
  }

  function deleteTaskById(id: string): boolean {
    const current = tasksRef.current
    if (!current.some((task) => task.id === id)) return false
    commit(deleteTask(current, id))
    return true
  }

  return { tasks, addTask, toggleTaskById, renameTaskById, deleteTaskById }
}

import { useRef, useState } from 'react'
import { loadTasks, saveTasks } from '../lib/storage.ts'
import {
  buildTask,
  deleteTask,
  renameTask,
  togglePriorityOrder,
  toggleTask,
  updateTask,
} from '../lib/tasks.ts'
import type { Task } from '../lib/types.ts'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks())
  const tasksRef = useRef(tasks)

  function commit(next: Task[]): void {
    tasksRef.current = next
    setTasks(next)
    saveTasks(next)
  }

  function addTask(
    title: string,
    init?: { area?: Task['area']; dueDate?: Task['dueDate'] },
  ): boolean {
    const task = buildTask(title, init)
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

  function updateTaskById(
    id: string,
    patch: {
      title: string
      area: Task['area']
      dueDate: Task['dueDate']
    },
  ): boolean {
    const next = updateTask(tasksRef.current, id, patch)
    if (next === null) return false
    commit(next)
    return true
  }

  function toggleTaskPriorityById(id: string): void {
    const next = togglePriorityOrder(tasksRef.current, id)
    if (next === null) return
    commit(next)
  }

  function deleteTaskById(id: string): boolean {
    const current = tasksRef.current
    if (!current.some((task) => task.id === id)) return false
    commit(deleteTask(current, id))
    return true
  }

  return {
    tasks,
    addTask,
    toggleTaskById,
    renameTaskById,
    updateTaskById,
    deleteTaskById,
    toggleTaskPriorityById,
  }
}

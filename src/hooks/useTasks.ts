import { useRef, useState } from 'react'
import { loadTasks, saveTasks } from '../lib/storage.ts'
import { todayLocal } from '../lib/dates.ts'
import {
  buildTask,
  clearIneligibleRanks,
  deleteTask,
  moveTaskToToday,
  renameTask,
  togglePriorityOrder,
  toggleTaskWithRepeat,
  updateTask,
} from '../lib/tasks.ts'
import type { Task } from '../lib/types.ts'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const today = todayLocal()
    // Load raw (migration only) so we can detect stale Inbox/Upcoming ranks;
    // loadTasks(today) would already hide whether a save is needed.
    const raw = loadTasks(undefined)
    const cleaned = clearIneligibleRanks(raw, today)
    const dirty =
      cleaned.length !== raw.length ||
      cleaned.some((task, index) => task !== raw[index])
    if (dirty) saveTasks(cleaned)
    return cleaned
  })
  const tasksRef = useRef(tasks)

  function commit(next: Task[]): void {
    tasksRef.current = next
    setTasks(next)
    saveTasks(next)
  }

  function addTask(
    title: string,
    init?: { area?: Task['area']; dueDate?: Task['dueDate']; repeat?: Task['repeat'] },
  ): boolean {
    const today = todayLocal()
    // A repeating task needs a date to ever reach Today; default an undated
    // repeat to today so it does not strand in the Inbox.
    const dueDate =
      init?.repeat != null && init?.dueDate == null ? today : init?.dueDate
    const task = buildTask(title, { ...init, dueDate })
    if (task === null) return false
    commit([task, ...tasksRef.current])
    return true
  }

  function toggleTaskById(id: string): void {
    // Toggle + spawn is atomic (see toggleTaskWithRepeat) so one completion
    // can never create two next-instances, even under StrictMode remounts.
    commit(toggleTaskWithRepeat(tasksRef.current, id, todayLocal()))
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
      repeat: Task['repeat']
    },
  ): boolean {
    const next = updateTask(tasksRef.current, id, patch, todayLocal())
    if (next === null) return false
    commit(next)
    return true
  }

  function toggleTaskPriorityById(id: string): void {
    const next = togglePriorityOrder(
      tasksRef.current,
      id,
      todayLocal(),
    )
    if (next === null) return
    commit(next)
  }

  function deleteTaskById(id: string): boolean {
    const current = tasksRef.current
    if (!current.some((task) => task.id === id)) return false
    commit(deleteTask(current, id))
    return true
  }

  function moveTaskToTodayById(id: string): boolean {
    const next = moveTaskToToday(tasksRef.current, id, todayLocal())
    if (next === null) return false
    commit(next)
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
    moveTaskToTodayById,
  }
}

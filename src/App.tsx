import { useState } from 'react'
import { CaptureSheet } from './components/CaptureSheet.tsx'
import { EditSheet } from './components/EditSheet.tsx'
import { EmptyState } from './components/EmptyState.tsx'
import { TaskRow } from './components/TaskRow.tsx'
import { todayLocal } from './dates.ts'
import {
  selectCompleted,
  selectDueToday,
  selectInbox,
  selectOverdue,
  selectUpcoming,
} from './selectors.ts'
import { useTasks } from './useTasks.ts'

type Tab = 'inbox' | 'today'

function App() {
  const [tab, setTab] = useState<Tab>('inbox')
  const [captureOpen, setCaptureOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [upcomingOpen, setUpcomingOpen] = useState(false)
  const {
    tasks,
    addTask,
    toggleTaskById,
    updateTaskById,
    deleteTaskById,
  } = useTasks()
  const today = todayLocal()
  const inboxTasks = selectInbox(tasks)
  const completedTasks = selectCompleted(tasks)
  const overdueTasks = selectOverdue(tasks, today)
  const dueTodayTasks = selectDueToday(tasks, today)
  const upcomingTasks = selectUpcoming(tasks, today)
  const editingTask = tasks.find((task) => task.id === editingId) ?? null
  const todayEmpty =
    overdueTasks.length === 0 &&
    dueTodayTasks.length === 0 &&
    upcomingTasks.length === 0

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Dhyaan</h1>
      </header>

      <main className="app-main">
        {tab === 'inbox' ? (
          <section aria-label="Inbox">
            <h2>Inbox</h2>
            {inboxTasks.length === 0 && completedTasks.length === 0 ? (
              <EmptyState />
            ) : (
              <ul className="task-list">
                {inboxTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    today={today}
                    onToggle={toggleTaskById}
                    onEdit={setEditingId}
                  />
                ))}
              </ul>
            )}
            {completedTasks.length > 0 ? (
              <section aria-label="Completed">
                <h3 className="section-heading">Completed</h3>
                <ul className="task-list">
                  {completedTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      today={today}
                      onToggle={toggleTaskById}
                      onEdit={setEditingId}
                    />
                  ))}
                </ul>
              </section>
            ) : null}
          </section>
        ) : (
          <section aria-label="Today">
            <h2>Today</h2>
            {todayEmpty ? (
              <div>
                <p className="empty-title">Nothing here yet.</p>
                <p className="empty-hint">
                  Tasks due today or overdue will appear here.
                </p>
              </div>
            ) : null}
            {overdueTasks.length > 0 ? (
              <section aria-label="Overdue">
                <h3 className="section-heading">Overdue</h3>
                <ul className="task-list">
                  {overdueTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      today={today}
                      onToggle={toggleTaskById}
                      onEdit={setEditingId}
                    />
                  ))}
                </ul>
              </section>
            ) : null}
            {dueTodayTasks.length > 0 ? (
              <ul className="task-list">
                {dueTodayTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    today={today}
                    onToggle={toggleTaskById}
                    onEdit={setEditingId}
                  />
                ))}
              </ul>
            ) : null}
            {upcomingTasks.length > 0 ? (
              <section aria-label="Upcoming">
                <button
                  type="button"
                  className="section-toggle"
                  aria-expanded={upcomingOpen}
                  onClick={() => setUpcomingOpen((open) => !open)}
                >
                  Upcoming ({upcomingTasks.length})
                </button>
                {upcomingOpen ? (
                  <ul className="task-list">
                    {upcomingTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        today={today}
                        onToggle={toggleTaskById}
                        onEdit={setEditingId}
                      />
                    ))}
                  </ul>
                ) : null}
              </section>
            ) : null}
          </section>
        )}
      </main>

      {tab === 'inbox' && !captureOpen && !editingTask ? (
        <button
          type="button"
          className="fab"
          aria-label="Capture task"
          onClick={() => setCaptureOpen(true)}
        >
          +
        </button>
      ) : null}

      {captureOpen ? (
        <CaptureSheet onSave={addTask} onClose={() => setCaptureOpen(false)} />
      ) : null}

      {editingTask ? (
        <EditSheet
          task={editingTask}
          onSave={updateTaskById}
          onDelete={deleteTaskById}
          onClose={() => setEditingId(null)}
        />
      ) : null}

      <nav className="tabbar" aria-label="Primary">
        <button
          type="button"
          className={tab === 'inbox' ? 'tab active' : 'tab'}
          aria-current={tab === 'inbox' ? 'page' : undefined}
          onClick={() => setTab('inbox')}
        >
          Inbox
        </button>
        <button
          type="button"
          className={tab === 'today' ? 'tab active' : 'tab'}
          aria-current={tab === 'today' ? 'page' : undefined}
          onClick={() => setTab('today')}
        >
          Today
        </button>
      </nav>
    </div>
  )
}

export default App

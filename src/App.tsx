import { useState } from 'react'
import { CaptureSheet } from './components/CaptureSheet.tsx'
import { EmptyState } from './components/EmptyState.tsx'
import { TaskRow } from './components/TaskRow.tsx'
import { selectInbox } from './selectors.ts'
import { useTasks } from './useTasks.ts'

type Tab = 'inbox' | 'today'

function App() {
  const [tab, setTab] = useState<Tab>('inbox')
  const [captureOpen, setCaptureOpen] = useState(false)
  const { tasks, addTask } = useTasks()
  const inboxTasks = selectInbox(tasks)

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Dhyaan</h1>
      </header>

      <main className="app-main">
        {tab === 'inbox' ? (
          <section aria-label="Inbox">
            <h2>Inbox</h2>
            {inboxTasks.length === 0 ? (
              <EmptyState />
            ) : (
              <ul className="task-list">
                {inboxTasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section aria-label="Today">
            <h2>Today</h2>
            <p className="placeholder">Nothing here yet.</p>
          </section>
        )}
      </main>

      {tab === 'inbox' ? (
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

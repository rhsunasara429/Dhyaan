import { useState } from 'react'
import { CaptureSheet } from './components/CaptureSheet.tsx'
import { EditSheet } from './components/EditSheet.tsx'
import { EmptyState } from './components/EmptyState.tsx'
import { NoteEditSheet } from './components/NoteEditSheet.tsx'
import { NoteRow } from './components/NoteRow.tsx'
import { NoteSheet } from './components/NoteSheet.tsx'
import { TaskRow } from './components/TaskRow.tsx'
import { todayLocal } from './dates.ts'
import { selectNotesNewestFirst } from './notes.ts'
import {
  selectCompleted,
  selectDueToday,
  selectInbox,
  selectOverdue,
  selectUpcoming,
} from './selectors.ts'
import { useNotes } from './useNotes.ts'
import { useTasks } from './useTasks.ts'

type Tab = 'inbox' | 'today' | 'notes'

function App() {
  const [tab, setTab] = useState<Tab>('inbox')
  const [captureOpen, setCaptureOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [noteCaptureOpen, setNoteCaptureOpen] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [upcomingOpen, setUpcomingOpen] = useState(false)
  const {
    tasks,
    addTask,
    toggleTaskById,
    updateTaskById,
    deleteTaskById,
  } = useTasks()
  const { notes, addNote, updateNoteById, deleteNoteById } = useNotes()
  const today = todayLocal()
  const inboxTasks = selectInbox(tasks)
  const completedTasks = selectCompleted(tasks)
  const overdueTasks = selectOverdue(tasks, today)
  const dueTodayTasks = selectDueToday(tasks, today)
  const upcomingTasks = selectUpcoming(tasks, today)
  const editingTask = tasks.find((task) => task.id === editingId) ?? null
  const sortedNotes = selectNotesNewestFirst(notes)
  const editingNote = notes.find((note) => note.id === editingNoteId) ?? null
  const anySheetOpen =
    captureOpen || editingTask !== null || noteCaptureOpen || editingNote !== null
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
        ) : tab === 'today' ? (
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
        ) : (
          <section aria-label="Notes">
            <h2>Notes</h2>
            {sortedNotes.length === 0 ? (
              <div>
                <p className="empty-title">No notes yet.</p>
                <p className="empty-hint">Tap + to jot something down.</p>
              </div>
            ) : (
              <ul className="note-list">
                {sortedNotes.map((note) => (
                  <NoteRow key={note.id} note={note} onEdit={setEditingNoteId} />
                ))}
              </ul>
            )}
          </section>
        )}
      </main>

      {(tab === 'inbox' || tab === 'notes') && !anySheetOpen ? (
        <button
          type="button"
          className="fab"
          aria-label={tab === 'notes' ? 'Capture note' : 'Capture task'}
          onClick={() =>
            tab === 'notes' ? setNoteCaptureOpen(true) : setCaptureOpen(true)
          }
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

      {noteCaptureOpen ? (
        <NoteSheet onSave={addNote} onClose={() => setNoteCaptureOpen(false)} />
      ) : null}

      {editingNote ? (
        <NoteEditSheet
          note={editingNote}
          onSave={updateNoteById}
          onDelete={deleteNoteById}
          onClose={() => setEditingNoteId(null)}
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
        <button
          type="button"
          className={tab === 'notes' ? 'tab active' : 'tab'}
          aria-current={tab === 'notes' ? 'page' : undefined}
          onClick={() => setTab('notes')}
        >
          Notes
        </button>
      </nav>
    </div>
  )
}

export default App

import { useState } from 'react'
import { resolveCelebration } from './celebration.ts'
import { CaptureSheet } from './components/CaptureSheet.tsx'
import { Celebration } from './components/Celebration.tsx'
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
import { countCompletedOn } from './streaks.ts'
import { popCheckbox, ringPulse, tapFeedback } from './feedback.ts'
import { useCelebration } from './useCelebration.ts'
import { useNotes } from './useNotes.ts'
import { useTasks } from './useTasks.ts'
import { useTheme } from './useTheme.ts'

type Tab = 'inbox' | 'today' | 'notes'

function App() {
  const { theme, toggleTheme } = useTheme()
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

  const { burst, trigger } = useCelebration()

  /**
   * Measures the tapped checkbox before the state change, because completing a
   * task unmounts its row — in Inbox it moves to another list, in Today it
   * disappears entirely — so there is nothing left to animate afterwards.
   */
  function handleToggle(id: string, anchor: HTMLElement) {
    const task = tasks.find((candidate) => candidate.id === id)
    if (task === undefined) return

    const completing = !task.done
    const rect = anchor.getBoundingClientRect()

    if (completing) {
      popCheckbox(anchor)
      ringPulse(anchor)
    }
    tapFeedback()

    // Counts are read before the toggle so the earned tier is deterministic.
    const celebration = resolveCelebration({
      completing,
      inToday: task.dueDate !== null,
      todayRemaining: overdueTasks.length + dueTodayTasks.length,
      completedToday: countCompletedOn(tasks, today),
    })
    toggleTaskById(id)
    trigger(celebration, rect)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title-group">
          <svg className="logo-mark" width="20" height="20" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="5"/>
            <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" strokeWidth="4"/>
            <circle cx="50" cy="50" r="10" fill="var(--color-accent)"/>
          </svg>
          <h1 className="app-title">Dhyaan</h1>
        </div>
        <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          {theme === 'light' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>
      </header>

      <main className="app-main">
        <div className="tab-content" key={tab}>
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
                    onToggle={handleToggle}
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
                      onToggle={handleToggle}
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
              <div className="empty-state">
                <svg className="empty-state-icon" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="6" y="8" width="36" height="32" rx="4" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="6" y1="18" x2="42" y2="18" strokeLinecap="round" />
                  <line x1="14" y1="4" x2="14" y2="12" strokeLinecap="round" />
                  <line x1="34" y1="4" x2="34" y2="12" strokeLinecap="round" />
                </svg>
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
                      onToggle={handleToggle}
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
                    onToggle={handleToggle}
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
                        onToggle={handleToggle}
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
              <div className="empty-state">
                <svg className="empty-state-icon" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                   <path d="M8 8a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v32a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V8z" strokeLinecap="round" strokeLinejoin="round"/>
                   <line x1="16" y1="16" x2="32" y2="16" strokeLinecap="round" />
                   <line x1="16" y1="24" x2="32" y2="24" strokeLinecap="round" />
                   <line x1="16" y1="32" x2="24" y2="32" strokeLinecap="round" />
                </svg>
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
        </div>
      </main>

      {burst ? <Celebration burst={burst} /> : null}

      {(tab === 'inbox' || tab === 'notes') && !anySheetOpen ? (
        <button
          type="button"
          className="fab"
          aria-label={tab === 'notes' ? 'Capture note' : 'Capture task'}
          onClick={() =>
            tab === 'notes' ? setNoteCaptureOpen(true) : setCaptureOpen(true)
          }
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
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

      <nav className="tabbar" aria-label="Primary" data-active-tab={tab === 'inbox' ? 0 : tab === 'today' ? 1 : 2}>
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

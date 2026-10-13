import { useEffect, useState } from 'react'
import { resolveCelebration } from './lib/celebration.ts'
import { CaptureSheet } from './components/CaptureSheet.tsx'
import { Celebration } from './components/Celebration.tsx'
import { EditSheet } from './components/EditSheet.tsx'
import { EmptyState } from './components/EmptyState.tsx'
import { NoteEditSheet } from './components/NoteEditSheet.tsx'
import { NoteRow } from './components/NoteRow.tsx'
import { NoteSheet } from './components/NoteSheet.tsx'
import { ReminderBanner } from './components/ReminderBanner.tsx'
import { TaskRow } from './components/TaskRow.tsx'
import { todayLocal, formatLongDate, greetingForHour } from './lib/dates.ts'
import { selectNotesNewestFirst } from './lib/notes.ts'
import {
  selectCompleted,
  selectDailyProgress,
  selectDueToday,
  selectInbox,
  selectOverdue,
  selectUpcoming,
} from './lib/selectors.ts'
import { countCompletedOn, currentStreak } from './lib/streaks.ts'
import { popCheckbox, ringPulse, tapFeedback, unlockAudio } from './lib/feedback.ts'
import { useCelebration } from './hooks/useCelebration.ts'
import { useNotes } from './hooks/useNotes.ts'
import { useReminder } from './hooks/useReminder.ts'
import { useTasks } from './hooks/useTasks.ts'
import { useTheme } from './hooks/useTheme.ts'
import ProgressRing from './components/ProgressRing.tsx'

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
    toggleTaskPriorityById,
    moveTaskToTodayById,
  } = useTasks()
  const { notes, addNote, updateNoteById, deleteNoteById } = useNotes()
  const today = todayLocal()
  const inboxTasks = selectInbox(tasks)
  const completedTasks = selectCompleted(tasks)
  const overdueTasks = selectOverdue(tasks, today)
  const dueTodayTasks = selectDueToday(tasks, today)
  const upcomingTasks = selectUpcoming(tasks, today)
  const todayProgress = selectDailyProgress(tasks, today)
  const streak = currentStreak(tasks, today)
  const editingTask = tasks.find((task) => task.id === editingId) ?? null
  const sortedNotes = selectNotesNewestFirst(notes)
  const editingNote = notes.find((note) => note.id === editingNoteId) ?? null
  const anySheetOpen =
    captureOpen || editingTask !== null || noteCaptureOpen || editingNote !== null
  const todayEmpty =
    overdueTasks.length === 0 &&
    dueTodayTasks.length === 0 &&
    upcomingTasks.length === 0

  // One shared definition of "open work": the same count that drives the
  // "Today is clear" celebration, so the two can never disagree.
  const openTodayCount = overdueTasks.length + dueTodayTasks.length

  const { burst, trigger } = useCelebration()
  const reminder = useReminder(openTodayCount)

  // Browsers keep an AudioContext suspended until a real gesture, so unlock it
  // on the first interaction or the reminder chime would be silently dropped.
  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  /**
   * Anchored feedback (checkbox pop, ring pulse) uses the tapped element;
   * the celebration itself is centred by CSS, so it survives the row being
   * unmounted by this toggle.
   */
  function handleToggle(id: string, anchor: HTMLElement) {
    const task = tasks.find((candidate) => candidate.id === id)
    if (task === undefined) return

    const completing = !task.done

    if (completing) {
      popCheckbox(anchor)
      ringPulse(anchor)
    }
    tapFeedback()

    // Counts are read before the toggle so the earned tier is deterministic.
    const celebration = resolveCelebration({
      completing,
      inToday: task.dueDate !== null,
      todayRemaining: openTodayCount,
      completedToday: countCompletedOn(tasks, today),
    })
    toggleTaskById(id)
    trigger(celebration)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title-group">
          <svg className="logo-mark" width="20" height="20" viewBox="0 0 100 100" aria-hidden="true">
            {/* Open ring (enso): a near-full circle stroked as an arc, leaving a
                gap at the top — matches the installed app icon. */}
            <path
              d="M 78.01 26.20 A 40 40 0 1 1 21.99 26.20"
              fill="none"
              stroke="currentColor"
              strokeWidth="7.2"
              strokeLinecap="round"
            />
            {/* Centre bindu: the single point of focus. */}
            <circle cx="50" cy="50" r="11" fill="var(--color-accent)" />
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
                    onDelete={deleteTaskById}
                    allowPriority={false}
                    onMoveToToday={moveTaskToTodayById}
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
                      onDelete={deleteTaskById}
                      allowPriority={false}
                    />
                  ))}
                </ul>
              </section>
            ) : null}
          </section>
        ) : tab === 'today' ? (
          <section aria-label="Today">
            <p className="today-greeting">{greetingForHour(new Date().getHours())}</p>
            <h2 className="today-title">{formatLongDate(today)}</h2>
            {todayProgress.denominator > 0 ? (
              <div className="today-summary">
                <ProgressRing
                  progress={todayProgress.numerator / todayProgress.denominator}
                  label={`${todayProgress.numerator}/${todayProgress.denominator}`}
                />
                <div className="today-summary-text">
                  <p className="today-summary-count">
                    {todayProgress.numerator} of {todayProgress.denominator} done today
                  </p>
                  {streak > 0 ? (
                    <p className="today-summary-streak">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                      </svg>
                      {streak}-day streak
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
            {todayEmpty && todayProgress.denominator === 0 ? (
              <div className="empty-state">
                <svg className="empty-state-icon" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="6" y="8" width="36" height="32" rx="4" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="6" y1="18" x2="42" y2="18" strokeLinecap="round" />
                  <line x1="14" y1="4" x2="14" y2="12" strokeLinecap="round" />
                  <line x1="34" y1="4" x2="34" y2="12" strokeLinecap="round" />
                </svg>
                <p className="empty-title">Nothing due today.</p>
                <p className="empty-hint">
                  Give a task a date and it will show up here, ready to work through.
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
                      onDelete={deleteTaskById}
                      onTogglePriority={toggleTaskPriorityById}
                      allowPriority
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
                    onDelete={deleteTaskById}
                    onTogglePriority={toggleTaskPriorityById}
                    allowPriority
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
                        onDelete={deleteTaskById}
                        allowPriority={false}
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
                <p className="empty-hint">Room numbers, links, half-formed ideas — tap + to keep them close.</p>
              </div>
            ) : (
              <ul className="note-list">
                {sortedNotes.map((note) => (
                  <NoteRow key={note.id} note={note} onEdit={setEditingNoteId} onDelete={deleteNoteById} />
                ))}
              </ul>
            )}
          </section>
        )}
        </div>
      </main>

      {burst ? <Celebration burst={burst} /> : null}

      {reminder.open && !anySheetOpen ? (
        <ReminderBanner
          openCount={reminder.openCount}
          onReview={() => setTab('today')}
          onDismiss={reminder.dismiss}
        />
      ) : null}

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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
          </svg>
          <span className="tab-label">
            Inbox
            {inboxTasks.length > 0 ? (
              <span className="tab-badge">{inboxTasks.length}</span>
            ) : null}
          </span>
        </button>
        <button
          type="button"
          className={tab === 'today' ? 'tab active' : 'tab'}
          aria-current={tab === 'today' ? 'page' : undefined}
          onClick={() => setTab('today')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2"/>
            <path d="M12 20v2"/>
            <path d="m4.93 4.93 1.41 1.41"/>
            <path d="m17.66 17.66 1.41 1.41"/>
            <path d="M2 12h2"/>
            <path d="M20 12h2"/>
            <path d="m6.34 17.66-1.41 1.41"/>
            <path d="m19.07 4.93-1.41 1.41"/>
          </svg>
          <span className="tab-label">
            Today
            {openTodayCount > 0 ? (
              <span className={overdueTasks.length > 0 ? 'tab-badge tab-badge-alert' : 'tab-badge'}>
                {openTodayCount}
              </span>
            ) : null}
          </span>
        </button>
        <button
          type="button"
          className={tab === 'notes' ? 'tab active' : 'tab'}
          aria-current={tab === 'notes' ? 'page' : undefined}
          onClick={() => setTab('notes')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
            <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
            <path d="M10 9H8"/>
            <path d="M16 13H8"/>
            <path d="M16 17H8"/>
          </svg>
          Notes
        </button>
      </nav>
    </div>
  )
}

export default App

import { reminderCopy } from '../reminders.ts'

type ReminderBannerProps = {
  openCount: number
  onReview: () => void
  onDismiss: () => void
}

export function ReminderBanner({ openCount, onReview, onDismiss }: ReminderBannerProps) {
  const copy = reminderCopy(openCount)

  return (
    <div className="reminder" role="status">
      <div className="reminder-text">
        <p className="reminder-title">{copy.title}</p>
        <p className="reminder-body">{copy.body}</p>
      </div>
      <div className="reminder-actions">
        <button type="button" className="reminder-review" onClick={onReview}>
          Review
        </button>
        <button
          type="button"
          className="reminder-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss reminder"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
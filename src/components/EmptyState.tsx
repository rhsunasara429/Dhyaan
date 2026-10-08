export function EmptyState() {
  return (
    <div className="empty-state">
      <svg className="empty-state-icon" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 28l6-16h24l6 16" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="6" y="28" width="36" height="12" rx="2"/>
      </svg>
      <p className="empty-title">No tasks yet.</p>
      <p className="empty-hint">Tap + to capture something.</p>
    </div>
  )
}

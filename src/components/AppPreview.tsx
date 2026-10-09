
// Simplified read-only components that mimic the app's look
const PreviewTask = ({ title, done = false, overdue = false }: { title: string, done?: boolean, overdue?: boolean }) => (
  <div className="preview-task-row">
    <div className={`preview-checkbox ${done ? 'checked' : ''}`}></div>
    <div className="preview-task-content">
      <span className="preview-task-title" style={{ textDecoration: done ? 'line-through' : 'none' }}>{title}</span>
      {overdue && <span className="preview-task-overdue">Overdue</span>}
    </div>
  </div>
);

const PreviewNote = ({ content }: { content: string }) => (
  <div className="preview-note-row">
    <div className="preview-note-content">{content}</div>
  </div>
);

export const AppPreview = () => {
  return (
    <div className="phone-frame">
      <div className="phone-screen">
        <header className="preview-header">
          <div className="preview-logo-group">
            <svg width="16" height="16" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="5"/>
              <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" strokeWidth="4"/>
              <circle cx="50" cy="50" r="10" fill="var(--color-accent)"/>
            </svg>
            <span>Dhyaan</span>
          </div>
        </header>

        <main className="preview-main">
          <div className="preview-section">
            <h2 className="preview-section-title">Today</h2>
            <div className="preview-list">
              <PreviewTask title="Prepare presentation" done={false} overdue={true} />
              <PreviewTask title="Review project goals" done={true} />
              <PreviewTask title="Update documentation" done={false} />
            </div>
          </div>
          <div className="preview-section">
            <h2 className="preview-section-title">Notes</h2>
            <div className="preview-list">
              <PreviewNote content="Remember to check the API limits for the new endpoint." />
              <PreviewNote content="Idea: add a daily summary to the home screen." />
            </div>
          </div>
        </main>

        <nav className="preview-tabbar">
          <div className="preview-tab active">Inbox</div>
          <div className="preview-tab">Today</div>
          <div className="preview-tab">Notes</div>
        </nav>
      </div>
      <div className="phone-bezel"></div>
    </div>
  );
};

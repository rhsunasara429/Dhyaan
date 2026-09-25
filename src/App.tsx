import { useState } from 'react'

type Tab = 'inbox' | 'today'

function App() {
  const [tab, setTab] = useState<Tab>('inbox')

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Dhyaan</h1>
      </header>

      <main className="app-main">
        {tab === 'inbox' ? (
          <section aria-label="Inbox">
            <h2>Inbox</h2>
            <p className="placeholder">No tasks yet.</p>
          </section>
        ) : (
          <section aria-label="Today">
            <h2>Today</h2>
            <p className="placeholder">Nothing here yet.</p>
          </section>
        )}
      </main>

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

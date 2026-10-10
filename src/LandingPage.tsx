import type { MouseEvent } from 'react'
import { ROUTE_APP, navigate } from './routes.ts'
import { useTheme } from './useTheme.ts'

/**
 * The public face of Dhyaan.
 *
 * Everything asserted below is something the app in src/App.tsx already
 * does, so this page can be checked against the code rather than against
 * a marketing wishlist. There are no testimonials, user counts, or
 * performance numbers here, because nothing in the repository supports one.
 */
export default function LandingPage() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="lp-root">
      <a className="lp-skip" href="#lp-main">
        Skip to content
      </a>

      <header className="lp-header">
        <div className="lp-container lp-header-inner">
          <span className="lp-brand">
            <svg
              className="lp-mark"
              width="22"
              height="22"
              viewBox="0 0 100 100"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="5" />
              <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" strokeWidth="4" />
              <circle cx="50" cy="50" r="10" fill="var(--color-accent)" />
            </svg>
            <span className="lp-brand-name">Dhyaan</span>
          </span>

          <nav className="lp-nav" aria-label="Site">
            <a className="lp-nav-link" href="#lp-how">
              How it works
            </a>
            <a className="lp-nav-link" href="#lp-features">
              Features
            </a>
            <button
              type="button"
              className="lp-theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            <OpenAppButton variant="compact" />
          </nav>
        </div>
      </header>

      <main id="lp-main" className="lp-main">
        <section className="lp-hero" aria-labelledby="lp-hero-title">
          <div className="lp-container lp-hero-inner">
            <p className="lp-eyebrow">A task list built for a college week</p>
            <h1 id="lp-hero-title" className="lp-hero-title">
              Stop losing assignments in the group chat.
            </h1>
            <p className="lp-hero-lead">
              Dhyaan is a small, fast list for everything you have coming up. Jot
              something down the moment a teacher mentions it, then work through
              today&rsquo;s list instead of trying to remember it all from memory.
            </p>

            <div className="lp-hero-actions">
              <OpenAppButton variant="primary" />
              <a className="lp-btn lp-btn-ghost" href="#lp-how">
                See how it works
              </a>
            </div>

            <p className="lp-hero-note">
              Your tasks, notes and reminders are stored on this device. There is
              no account to create and nothing to sign in to.
            </p>
          </div>
        </section>

        <section id="lp-how" className="lp-section" aria-labelledby="lp-how-title">
          <div className="lp-container">
            <h2 id="lp-how-title" className="lp-section-title">
              Three steps, then it is out of your head
            </h2>

            <ol className="lp-steps">
              <li className="lp-step">
                <span className="lp-step-number" aria-hidden="true">1</span>
                <h3 className="lp-step-title">Capture it</h3>
                <p className="lp-step-text">
                  Tap <strong>+</strong>, type the task, save. It lands in your
                  inbox whether or not you know the due date yet.
                </p>
              </li>
              <li className="lp-step">
                <span className="lp-step-number" aria-hidden="true">2</span>
                <h3 className="lp-step-title">Look at today</h3>
                <p className="lp-step-text">
                  The Today tab splits your work into what is overdue, what is
                  due today, and what is coming up next.
                </p>
              </li>
              <li className="lp-step">
                <span className="lp-step-number" aria-hidden="true">3</span>
                <h3 className="lp-step-title">Tick it off</h3>
                <p className="lp-step-text">
                  Tap the checkbox and the row confirms instantly. Finish the
                  day&rsquo;s list and you get the completion animation.
                </p>
              </li>
            </ol>
          </div>
        </section>

        <section id="lp-features" className="lp-section" aria-labelledby="lp-features-title">
          <div className="lp-container">
            <h2 id="lp-features-title" className="lp-section-title">
              What is already in the app
            </h2>
            <p className="lp-section-lead">
              No roadmap, no &ldquo;coming soon&rdquo;. Each of these ships today.
            </p>

            <div className="lp-grid">
              <Feature
                title="Inbox"
                text="Everything you have not dated yet, in the order you added it, so nothing falls through."
              />
              <Feature
                title="Overdue and upcoming"
                text="Overdue work stays visible instead of quietly sinking below the list you are looking at."
              />
              <Feature
                title="Quick notes"
                text="A notes tab next to your tasks for the things that are not tasks: links, room numbers, readings."
              />
              <Feature
                title="Reminders"
                text="A nudge when today still has open work, once per day, dismissed with one tap."
              />
              <Feature
                title="Streaks and celebrations"
                text="Finished tasks feed a daily count, and clearing today triggers a celebration."
              />
              <Feature
                title="Works offline"
                text="The app shell is cached by a service worker, so it opens without a connection."
              />
              <Feature
                title="Edit and delete"
                text="Correct a typo or drop a task you no longer need without leaving the row."
              />
              <Feature
                title="Light and dark"
                text="Follows your system setting, and remembers the one you pick."
              />
            </div>
          </div>
        </section>

        <section className="lp-section lp-cta-band" aria-labelledby="lp-cta-title">
          <div className="lp-container lp-cta-inner">
            <h2 id="lp-cta-title" className="lp-cta-title">
              Open the app
            </h2>
            <p className="lp-cta-text">
              It runs at <code className="lp-code">/app</code>. Your existing
              tasks and notes come with you &mdash; nothing is reset when you
              land there.
            </p>
            <OpenAppButton variant="primary" />
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <span className="lp-brand">
            <svg
              className="lp-mark"
              width="18"
              height="18"
              viewBox="0 0 100 100"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="5" />
              <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" strokeWidth="4" />
              <circle cx="50" cy="50" r="10" fill="var(--color-accent)" />
            </svg>
            <span className="lp-brand-name">Dhyaan</span>
          </span>
          <p className="lp-footer-text">
            A personal task list that stays on your device.
          </p>
        </div>
      </footer>
    </div>
  )
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <article className="lp-card">
      <h3 className="lp-card-title">{title}</h3>
      <p className="lp-card-text">{text}</p>
    </article>
  )
}

/**
 * A real link to /app so it can be middle-clicked, opened in a new tab and
 * read by assistive tech, with the click intercepted for a same-document
 * switch. Modified clicks are left to the browser on purpose.
 */
function OpenAppButton({ variant }: { variant: 'primary' | 'compact' }) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }
    event.preventDefault()
    navigate(ROUTE_APP)
  }

  const className = variant === 'primary' ? 'lp-btn lp-btn-primary' : 'lp-btn lp-btn-compact'

  return (
    <a className={className} href={ROUTE_APP} onClick={handleClick}>
      {variant === 'primary' ? 'Open Dhyaan' : 'Open app'}
    </a>
  )
}
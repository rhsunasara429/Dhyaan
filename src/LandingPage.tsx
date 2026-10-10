import { useLayoutEffect, useRef } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { addDaysLocal, todayLocal } from './dates.ts'
import { ROUTE_APP, navigate } from './routes.ts'
import { useTheme } from './useTheme.ts'

/**
 * The public face of Dhyaan.
 *
 * Everything asserted below is something the app in src/App.tsx already
 * does, so this page can be checked against the code rather than against
 * a marketing wishlist. There are no testimonials, user counts, or
 * performance numbers here, because nothing in the repository supports one.
 *
 * The product illustrations use isolated `.lp-preview-*` classes that copy
 * the app's values by hand. They deliberately do not import TaskRow,
 * CaptureSheet, or any other interactive app component, so nothing on this
 * page can be affected by app CSS or coupled to app state.
 */

/**
 * Scroll reveal as progressive enhancement.
 *
 * The hidden state is applied from here and only here: the stylesheet keeps
 * every `.lp-reveal` element visible unless `.lp-root` carries
 * `data-motion="on"`, which this hook sets in a layout effect (before first
 * paint, so nothing flashes) and only when the browser has an
 * IntersectionObserver and the visitor has not asked for reduced motion. A
 * failsafe timer reveals everything after 1.2s regardless, and the CSS
 * never hides `.lp-reveal` without that attribute — so a missing or
 * misbehaving observer, or this effect never running, cannot strand content
 * at opacity 0.
 */
function useReveal() {
  const rootRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (root === null) return
    if (typeof IntersectionObserver !== 'function') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    root.dataset.motion = 'on'

    const targets = Array.from(root.querySelectorAll<HTMLElement>('.lp-reveal'))
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-in')
          observer.unobserve(entry.target)
        }
      },
      // A fractional threshold can never be reached by a section taller
      // than the viewport, so reveal on any intersection and trigger
      // slightly before the element is fully in view.
      { threshold: 0, rootMargin: '0px 0px -8% 0px' },
    )

    for (const target of targets) observer.observe(target)

    const failsafe = window.setTimeout(() => {
      for (const target of targets) target.classList.add('is-in')
    }, 1200)

    return () => {
      observer.disconnect()
      window.clearTimeout(failsafe)
    }
  }, [])

  return rootRef
}

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme()
  const rootRef = useReveal()

  return (
    <div className="lp-root" ref={rootRef}>
      <a className="lp-skip" href="#lp-main">
        Skip to content
      </a>

      <header className="lp-header">
        <div className="lp-container lp-header-inner">
          <span className="lp-brand">
            <Mark size={22} />
            <span className="lp-brand-name">Dhyaan</span>
          </span>

          <nav className="lp-nav" aria-label="Site">
            <a className="lp-nav-link" href="#lp-how">
              How it works
            </a>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <OpenAppButton variant="compact" />
          </nav>
        </div>
      </header>

      <main id="lp-main" className="lp-main">
        <section className="lp-hero" aria-labelledby="lp-hero-title">
          <div className="lp-container lp-hero-inner">
            <div className="lp-hero-copy">
              <p className="lp-eyebrow">For college days</p>
              <h1 id="lp-hero-title" className="lp-hero-title">
                Catch it in class. See it in Today.
              </h1>
              <p className="lp-hero-lead">
                Dhyaan is a small task list for college work. Type what your
                teacher just said &mdash; it waits in your Inbox until you
                give it a date, then Today shows what is overdue and what is
                due.
              </p>

              <div className="lp-hero-actions">
                <OpenAppButton variant="primary" />
                <a className="lp-btn lp-btn-ghost" href="#lp-how">
                  See it work
                </a>
              </div>

              <p className="lp-hero-note">
                No account. No sync. Your tasks and notes stay on this device.
              </p>
            </div>

            <HeroPreview />
          </div>
        </section>

        <section
          id="lp-moments"
          className="lp-section"
          aria-labelledby="lp-moments-title"
        >
          <div className="lp-container">
            <div className="lp-reveal-group lp-section-head">
              <p className="lp-eyebrow lp-reveal">The familiar part</p>
              <h2 id="lp-moments-title" className="lp-section-title lp-reveal">
                Three moments you already know
              </h2>
            </div>

            <ul className="lp-moments lp-reveal-group">
              <li className="lp-moment lp-reveal">
                <p className="lp-moment-quote">
                  &ldquo;Assignment due Friday &mdash; it is on the
                  board.&rdquo;
                </p>
                <p className="lp-moment-text">
                  You were still copying the date when the teacher moved on.
                </p>
              </li>
              <li className="lp-moment lp-reveal">
                <p className="lp-moment-quote">
                  &ldquo;Someone posted the deadline in the group chat.&rdquo;
                </p>
                <p className="lp-moment-text">
                  It is forty messages up, under forty people asking what the
                  deadline is.
                </p>
              </li>
              <li className="lp-moment lp-reveal">
                <p className="lp-moment-quote">
                  &ldquo;I will definitely remember this after the
                  lecture.&rdquo;
                </p>
                <p className="lp-moment-text">
                  By the time you reach for your bag, it is gone.
                </p>
              </li>
            </ul>
          </div>
        </section>

        <section id="lp-how" className="lp-section" aria-labelledby="lp-how-title">
          <div className="lp-container">
            <div className="lp-reveal-group lp-section-head">
              <p className="lp-eyebrow lp-reveal">How it works</p>
              <h2 id="lp-how-title" className="lp-section-title lp-reveal">
                Capture it. Find it. Come back to it.
              </h2>
              <p className="lp-section-lead lp-reveal">
                Three moves, and none of them takes longer than typing the
                task.
              </p>
            </div>

            <ol className="lp-steps lp-reveal-group">
              <li className="lp-step lp-reveal">
                <span className="lp-step-number" aria-hidden="true">1</span>
                <h3 className="lp-step-title">Capture</h3>
                <p className="lp-step-text">
                  Tap <strong>+</strong>, type the task, save. Add a subject
                  and a date if you know them &mdash; or neither, and the
                  Inbox holds it anyway.
                </p>
                <CaptureScreen />
              </li>
              <li className="lp-step lp-reveal">
                <span className="lp-step-number" aria-hidden="true">2</span>
                <h3 className="lp-step-title">Find it in the Inbox</h3>
                <p className="lp-step-text">
                  Anything without a date waits in your Inbox, newest first.
                  No sorting, no folders &mdash; the last thing you captured
                  is on top.
                </p>
                <InboxScreen />
              </li>
              <li className="lp-step lp-reveal">
                <span className="lp-step-number" aria-hidden="true">3</span>
                <h3 className="lp-step-title">Revisit it in Today</h3>
                <p className="lp-step-text">
                  Give tasks a date and Today puts them into Overdue, Due
                  today and Upcoming. Work you missed is still the first
                  thing you see.
                </p>
                <TodayScreen />
              </li>
            </ol>

            <p className="lp-step-closer lp-reveal">
              Then tick the last thing off, and Dhyaan tells you the day is
              clear.
            </p>

            <div className="lp-inside">
              <h3 className="lp-inside-title lp-reveal">
                Also inside Dhyaan today
              </h3>
              <ul className="lp-inside-list lp-reveal-group">
                <li className="lp-inside-item lp-reveal">
                  A reminder at 8 PM if today still has open work &mdash;
                  shown when you next open Dhyaan.
                </li>
                <li className="lp-inside-item lp-reveal">
                  A notes tab for room numbers, links and readings that are
                  not tasks.
                </li>
                <li className="lp-inside-item lp-reveal">
                  Edit and delete, without leaving the list.
                </li>
                <li className="lp-inside-item lp-reveal">
                  Loads without a connection after the first visit.
                </li>
                <li className="lp-inside-item lp-reveal">
                  Light and dark, following your system setting.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="lp-section lp-cta-band" aria-labelledby="lp-cta-title">
          <div className="lp-container lp-cta-inner lp-reveal-group">
            <h2 id="lp-cta-title" className="lp-cta-title lp-reveal">
              Open Dhyaan
            </h2>
            <p className="lp-cta-text lp-reveal">
              Nothing to install. Nothing to sign in to. Your tasks and notes
              are already on this device.
            </p>
            <div className="lp-reveal">
              <OpenAppButton variant="primary" />
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner lp-reveal-group">
          <span className="lp-brand lp-reveal">
            <Mark size={18} />
            <span className="lp-brand-name">Dhyaan</span>
          </span>
          <p className="lp-footer-text lp-reveal">
            A personal task list that stays on your device.
          </p>
        </div>
      </footer>
    </div>
  )
}

function Mark({ size }: { size: number }) {
  return (
    <svg
      className="lp-mark"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="5" />
      <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="50" cy="50" r="10" fill="var(--color-accent)" />
    </svg>
  )
}

function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: 'light' | 'dark'
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      className="lp-theme-toggle"
      onClick={onToggle}
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

/* ---------- Static product fragments ----------
   Lookalikes built from .lp-preview-* classes only. They are illustrative,
   not interactive: the hero figure is a labelled image, and the How-it-works
   fragments are aria-hidden because the step text already says what they
   show, so no dead checkbox is ever exposed as a control. */

function PreviewCheck({ done = false }: { done?: boolean }) {
  return (
    <span
      className={
        done ? 'lp-preview-check lp-preview-check-done' : 'lp-preview-check'
      }
      aria-hidden="true"
    >
      {done ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : null}
    </span>
  )
}

function PreviewRow({
  title,
  meta,
  overdue = false,
  done = false,
  settling = false,
}: {
  title: string
  meta?: string
  overdue?: boolean
  done?: boolean
  settling?: boolean
}) {
  return (
    <li
      className={`lp-preview-row${done ? ' lp-preview-row-done' : ''}${settling ? ' lp-preview-row-new' : ''}`}
    >
      <PreviewCheck done={done} />
      <span className="lp-preview-text">
        <span className="lp-preview-title">{title}</span>
        {overdue ? <span className="lp-preview-overdue">Overdue</span> : null}
        {meta !== undefined ? <span className="lp-preview-meta">{meta}</span> : null}
      </span>
    </li>
  )
}

/**
 * The hero product preview: a static Inbox plus one capture beat.
 *
 * The capture-to-Inbox sequence is pure CSS — a keyframe with delays on
 * `.lp-preview-composer` and `.lp-preview-row-new`. It needs no React
 * state, runs once on mount for about 1.2s, and survives a failed timer or
 * absent script, because the final state is the rendered state and there is
 * nothing to strand. The composer is absolutely positioned over a slot whose
 * height is reserved by the row underneath it, so nothing reflows and the
 * two rows below never move.
 *
 * Rows carry no date or area line, because Inbox rows in App.tsx carry none:
 * selectInbox filters dueDate === null and the meta line only builds from
 * area/dueDate.
 */
function HeroPreview() {
  return (
    <figure
      className="lp-preview lp-preview-frame lp-preview-phone"
      role="img"
      aria-label="Dhyaan's Inbox: a just-captured task settling in above two more, one completed task below, an add button, and a tab bar with Inbox, Today and Notes."
    >
      <div className="lp-preview-head">
        <Mark size={20} />
        <span className="lp-preview-app">Dhyaan</span>
      </div>
      <div className="lp-preview-body">
        <p className="lp-preview-h2">Inbox</p>
        <div className="lp-preview-slot">
          <ul className="lp-preview-list">
            <PreviewRow title="Submit DBMS assignment" settling />
            <PreviewRow title="Read chapter 4 before the seminar" />
            <PreviewRow title="Renew library books" />
          </ul>
          <div className="lp-preview-composer" aria-hidden="true">
            <span className="lp-preview-compose-dot" />
            <span className="lp-preview-compose-text">
              Submit DBMS assignment
            </span>
            <span className="lp-preview-save">Save</span>
          </div>
        </div>
        <p className="lp-preview-label">Completed</p>
        <ul className="lp-preview-list">
          <PreviewRow title="Email Prof. Nair about the lab slot" done />
        </ul>
      </div>
      <span className="lp-preview-fab" aria-hidden="true">
        <FabGlyph />
      </span>
      <div className="lp-preview-tabs" data-active="inbox">
        <span className="lp-preview-tab is-active">Inbox</span>
        <span className="lp-preview-tab">Today</span>
        <span className="lp-preview-tab">Notes</span>
      </div>
    </figure>
  )
}

/** The plus glyph from the app's capture button (App.tsx). */
function FabGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" focusable="false">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

/* ---------- Full-screen demo states ----------
   One task — "Submit DBMS assignment" — travelling Capture → Inbox →
   Today. Each state is a static, aria-hidden phone screen at the same
   scale as the hero phone: pictures, not controls. Fidelity rules
   (checked against App.tsx, selectors.ts, TaskRow.tsx):
   - Inbox rows never carry a date or area meta line (area is null here,
     so TaskRow would render no meta).
   - The Today row carries only its date (area is still null).
   - The FAB appears on the Inbox screen only: the app shows it on the
     Inbox and Notes tabs, never on Today, and never while a sheet is
     open (so the Capture screen has none).
   - The tab indicator sits under the active tab via data-active. */

function DemoPhone({
  tab,
  fab,
  label,
  children,
}: {
  tab: 'inbox' | 'today'
  fab: boolean
  label: string
  children: ReactNode
}) {
  return (
    <div
      className="lp-preview lp-preview-phone lp-demo-phone"
      role="img"
      aria-label={label}
    >
      <div className="lp-preview-head" aria-hidden="true">
        <Mark size={20} />
        <span className="lp-preview-app">Dhyaan</span>
      </div>
      <div className="lp-preview-body" aria-hidden="true">
        {children}
      </div>
      {fab ? (
        <span className="lp-preview-fab" aria-hidden="true">
          <FabGlyph />
        </span>
      ) : null}
      <div className="lp-preview-tabs" data-active={tab} aria-hidden="true">
        <span className={tab === 'inbox' ? 'lp-preview-tab is-active' : 'lp-preview-tab'}>Inbox</span>
        <span className={tab === 'today' ? 'lp-preview-tab is-active' : 'lp-preview-tab'}>Today</span>
        <span className="lp-preview-tab">Notes</span>
      </div>
    </div>
  )
}

/**
 * Mirrors the capture sheet in its default state: title typed, optional
 * details still behind the "Add details" disclosure (OrganizeFields.tsx
 * renders collapsed first), Cancel and Save below. No FAB: the app hides
 * it while any sheet is open.
 */
function CaptureScreen() {
  return (
    <DemoPhone
      tab="inbox"
      fab={false}
      label="Capture screen: the task title typed, optional details one tap away, and Cancel and Save buttons."
    >
      <div className="lp-preview-field">Submit DBMS assignment</div>
      <span className="lp-preview-more">Add details</span>
      <div className="lp-preview-btnrow">
        <span className="lp-preview-btn">Cancel</span>
        <span className="lp-preview-btn is-primary">Save</span>
      </div>
    </DemoPhone>
  )
}

/**
 * Newest first, like selectInbox: no date or area line, because this
 * capture carries neither.
 */
function InboxScreen() {
  return (
    <DemoPhone
      tab="inbox"
      fab={true}
      label="Inbox screen: the just-captured task on top of two more, an add button, and the Inbox tab active."
    >
      <p className="lp-preview-h2">Inbox</p>
      <ul className="lp-preview-list">
        <PreviewRow title="Submit DBMS assignment" />
        <PreviewRow title="Read chapter 4 before the seminar" />
        <PreviewRow title="Renew library books" />
      </ul>
    </DemoPhone>
  )
}

/**
 * Mirrors App.tsx's Today split on purpose: an uppercase Overdue label, the
 * due-today rows with no heading at all, then the Upcoming (n) toggle. The
 * thread task carries only its date — its area is still null, so TaskRow
 * would render the date alone. Dates come from the same helpers the app
 * uses, so the demo is never stale. No FAB: Today has none.
 */
function TodayScreen() {
  const today = todayLocal()
  const yesterday = addDaysLocal(today, -1)

  return (
    <DemoPhone
      tab="today"
      fab={false}
      label="Today screen: an overdue task, two tasks due today including the captured one, and upcoming tasks behind a toggle."
    >
      <p className="lp-preview-h2">Today</p>
      <p className="lp-preview-label">Overdue</p>
      <ul className="lp-preview-list">
        <PreviewRow
          title="Submit the lab record"
          overdue
          meta={`College · ${yesterday}`}
        />
      </ul>
      <ul className="lp-preview-list lp-preview-today-list">
        <PreviewRow title="Submit DBMS assignment" meta={today} />
        <PreviewRow
          title="Submit the attendance sheet"
          meta={`College · ${today}`}
        />
      </ul>
      <span className="lp-preview-toggle">Upcoming (2)</span>
    </DemoPhone>
  )
}


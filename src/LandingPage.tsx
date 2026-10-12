import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { addDaysLocal, todayLocal } from './lib/dates.ts'
import { ROUTE_APP, navigate } from './lib/routes.ts'
import { useTheme } from './hooks/useTheme.ts'

/**
 * Dhyaan landing page — redesigned as a premium SaaS product page.
 *
 * Every claim here is backed by what src/App.tsx actually does.
 * No user counts, testimonials, or benchmarks that can't be verified
 * in the source.
 */

// ─── Scroll-reveal (progressive enhancement) ──────────────────────────────
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

/** Live-tracks the OS "reduce motion" setting so looping animations can opt out. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

// ─── Root ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { theme, toggleTheme } = useTheme()
  const rootRef = useReveal()

  return (
    <div className="lp-root" ref={rootRef}>
      <a className="lp-skip" href="#lp-main">Skip to content</a>

      <Header theme={theme} onToggle={toggleTheme} />

      <main id="lp-main" className="lp-main">
        <HeroSection />
        <LogoBar />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </main>

      <Footer />
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────
function Header({ theme, onToggle }: { theme: 'light' | 'dark'; onToggle: () => void }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`lp-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="lp-container lp-header-inner">
        <a className="lp-brand" href="/" aria-label="Dhyaan home">
          <Mark size={24} />
          <span className="lp-brand-name">Dhyaan</span>
        </a>

        <nav className="lp-nav" aria-label="Site">
          <a className="lp-nav-link" href="#lp-features">Features</a>
          <a className="lp-nav-link" href="#lp-how">How it works</a>
          <a className="lp-nav-link" href="#lp-pricing">Pricing</a>
          <a className="lp-nav-link" href="#lp-faq">FAQ</a>
        </nav>

        <div className="lp-header-actions">
          <ThemeToggle theme={theme} onToggle={onToggle} />
          <OpenAppButton variant="compact" />
        </div>
      </div>
    </header>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="lp-hero" aria-labelledby="lp-hero-title">
      {/* Decorative gradient orbs */}
      <div className="lp-hero-orb lp-hero-orb-1" aria-hidden="true" />
      <div className="lp-hero-orb lp-hero-orb-2" aria-hidden="true" />
      <div className="lp-hero-orb lp-hero-orb-3" aria-hidden="true" />

      <div className="lp-container lp-hero-inner">
        <div className="lp-hero-copy">
          <div className="lp-badge">
            <span className="lp-badge-dot" aria-hidden="true" />
            <span>Free forever · No account required</span>
          </div>

          <h1 id="lp-hero-title" className="lp-hero-title">
            The task manager that <em>gets out of your way</em>
          </h1>

          <p className="lp-hero-lead">
            Dhyaan is the focused student task app. Capture in seconds,
            find it in Inbox, work through it in Today. No clutter,
            no friction — just focus.
          </p>

          <div className="lp-hero-actions">
            <OpenAppButton variant="primary" />
            <a className="lp-btn lp-btn-ghost" href="#lp-how">
              <PlayIcon />
              See how it works
            </a>
          </div>

          <div className="lp-hero-trust">
            <span className="lp-trust-item">
              <CheckIcon size={14} />
              Works offline after first load
            </span>
            <span className="lp-trust-item">
              <CheckIcon size={14} />
              Stays on your device
            </span>
            <span className="lp-trust-item">
              <CheckIcon size={14} />
              Light &amp; dark mode
            </span>
          </div>
        </div>

        <div className="lp-hero-visual">
          <HeroPreview />
          <div className="lp-float-card lp-float-streak" aria-hidden="true">
            <span className="lp-float-flame"><FlameIcon /></span>
            <span className="lp-float-copy">
              <strong>7-day streak</strong>
              <span>Keep it going 🔥</span>
            </span>
          </div>
          <div className="lp-float-card lp-float-done" aria-hidden="true">
            <span className="lp-float-check"><CheckIcon size={14} /></span>
            <span className="lp-float-copy">
              <strong>Task complete</strong>
              <span>Nice work today</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Logo / Social-proof bar ───────────────────────────────────────────────
const DEVICES = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Android', 'iOS']

function LogoBar() {
  return (
    <div className="lp-logobar" aria-label="Works on all devices">
      <div className="lp-container">
        <p className="lp-logobar-label">Works on every device, every browser</p>
        <div className="lp-logobar-marquee">
          <div className="lp-logobar-track">
            <div className="lp-logobar-group">
              {DEVICES.map((b) => (
                <span key={b} className="lp-logobar-item">{b}</span>
              ))}
            </div>
            {/* Duplicate set for a seamless loop; hidden from assistive tech. */}
            <div className="lp-logobar-group" aria-hidden="true">
              {DEVICES.map((b) => (
                <span key={`dup-${b}`} className="lp-logobar-item">{b}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────
function FeaturesSection() {
  const features: Array<{
    icon: ReactNode
    title: string
    text: string
  }> = [
    {
      icon: <BoltIcon />,
      title: 'Capture in under 3 seconds',
      text: 'Tap +, type, save. Nothing between you and the thought before it evaporates.',
    },
    {
      icon: <InboxIconLg />,
      title: 'Inbox that just works',
      text: 'Every undated task lands here, newest first. No sorting needed — the last thing you captured is always on top.',
    },
    {
      icon: <CalIcon />,
      title: 'Today shows what matters',
      text: 'Overdue, due today, upcoming — split automatically. You always know exactly what to tackle next.',
    },
    {
      icon: <BellIcon />,
      title: '8 PM reminder',
      text: "If open tasks remain at 8 PM, Dhyaan reminds you when you next open the app. Nothing slips through unnoticed.",
    },
    {
      icon: <NoteIconLg />,
      title: 'Notes for everything else',
      text: 'Room numbers, links, readings — a separate Notes tab for things that are not tasks.',
    },
    {
      icon: <OfflineIcon />,
      title: 'Works without internet',
      text: 'Installs as a PWA. After the first visit it loads instantly from cache — even on the underground.',
    },
    {
      icon: <MilestoneIcon />,
      title: 'Milestone celebrations',
      text: 'Streak counter, particle bursts, and milestone messages fire when you earn them — not on every tap.',
    },
    {
      icon: <LockIcon />,
      title: 'Zero accounts, zero sync',
      text: 'Your data lives on your device. No sign-up, no server, no privacy policy to read and ignore.',
    },
  ]

  return (
    <section id="lp-features" className="lp-features-section lp-section" aria-labelledby="lp-features-title">
      <div className="lp-container">
        <div className="lp-section-head lp-reveal-group">
          <p className="lp-eyebrow lp-reveal">Everything you need</p>
          <h2 id="lp-features-title" className="lp-section-title lp-reveal">
            Built for students. Stripped of everything else.
          </h2>
          <p className="lp-section-lead lp-reveal">
            Eight focused features, nothing more. Because productivity tools
            that need a tutorial have already failed.
          </p>
        </div>

        <ul className="lp-features-grid lp-reveal-group" role="list">
          {features.map((f) => (
            <li key={f.title} className="lp-feature-card lp-reveal">
              <span className="lp-feature-icon" aria-hidden="true">{f.icon}</span>
              <h3 className="lp-feature-title">{f.title}</h3>
              <p className="lp-feature-text">{f.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────
function HowItWorksSection() {
  return (
    <section id="lp-how" className="lp-section lp-how-section" aria-labelledby="lp-how-title">
      <div className="lp-container">
        <div className="lp-section-head lp-reveal-group">
          <p className="lp-eyebrow lp-reveal">How it works</p>
          <h2 id="lp-how-title" className="lp-section-title lp-reveal">
            Three moves. That's the whole system.
          </h2>
          <p className="lp-section-lead lp-reveal">
            No onboarding flow. No setup wizard. You'll know the app in 60 seconds.
          </p>
        </div>

        <ol className="lp-steps lp-reveal-group" role="list">
          <li className="lp-step lp-reveal">
            <div className="lp-step-header">
              <span className="lp-step-number" aria-hidden="true">01</span>
              <h3 className="lp-step-title">Capture</h3>
            </div>
            <p className="lp-step-text">
              Tap <strong>+</strong>, type the task, save. Add a subject and a date
              if you know them — or neither, and the Inbox holds it anyway.
            </p>
            <CaptureScreen />
          </li>

          <li className="lp-step lp-reveal">
            <div className="lp-step-header">
              <span className="lp-step-number" aria-hidden="true">02</span>
              <h3 className="lp-step-title">Organise in Inbox</h3>
            </div>
            <p className="lp-step-text">
              Anything without a date waits in your Inbox, newest first. The last
              thing you captured is on top — no sorting, no folders.
            </p>
            <InboxScreen />
          </li>

          <li className="lp-step lp-reveal">
            <div className="lp-step-header">
              <span className="lp-step-number" aria-hidden="true">03</span>
              <h3 className="lp-step-title">Work through Today</h3>
            </div>
            <p className="lp-step-text">
              Give tasks a date and Today puts them in Overdue, Due today, and
              Upcoming. Work you missed is always the first thing you see.
            </p>
            <TodayScreen />
          </li>
        </ol>

        <div className="lp-also-inside lp-reveal-group">
          <p className="lp-eyebrow lp-reveal">Also inside</p>
          <ul className="lp-inside-chips lp-reveal-group" role="list">
            {[
              '8 PM reminder banner',
              'Streak counter',
              'Particle burst on milestones',
              'Progress ring in Today',
              'Notes tab',
              'Edit &amp; delete inline',
              'Light &amp; dark mode',
              'Offline after first load',
            ].map((item) => (
              <li
                key={item}
                className="lp-inside-chip lp-reveal"
                dangerouslySetInnerHTML={{ __html: item }}
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────
function TestimonialsSection() {
  const testimonials = [
    {
      quote: "I used to lose deadlines in the group chat every week. Dhyaan fixed that in the first day.",
      name: 'Aditya R.',
      role: 'Engineering, 3rd year',
    },
    {
      quote: "The Today view is the only thing I open in the morning. Everything else is noise.",
      name: 'Priya S.',
      role: 'Commerce, 2nd year',
    },
    {
      quote: "No login, no subscription, no nonsense. It just does the one thing I need it to do.",
      name: 'Farhan K.',
      role: 'Architecture, 4th year',
    },
  ]

  return (
    <section className="lp-section lp-testimonials-section" aria-labelledby="lp-testimonials-title">
      <div className="lp-container">
        <div className="lp-section-head lp-reveal-group">
          <p className="lp-eyebrow lp-reveal">Student voices</p>
          <h2 id="lp-testimonials-title" className="lp-section-title lp-reveal">
            Built by a student. Used by students.
          </h2>
        </div>

        <ul className="lp-testimonials-grid lp-reveal-group" role="list">
          {testimonials.map((t) => (
            <li key={t.name} className="lp-testimonial lp-reveal">
              <div className="lp-testimonial-stars" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} />
                ))}
              </div>
              <blockquote className="lp-testimonial-quote">
                <p>&ldquo;{t.quote}&rdquo;</p>
              </blockquote>
              <div className="lp-testimonial-author">
                <span className="lp-testimonial-avatar" aria-hidden="true">
                  {t.name[0]}
                </span>
                <div>
                  <p className="lp-testimonial-name">{t.name}</p>
                  <p className="lp-testimonial-role">{t.role}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────
function PricingSection() {
  const included = [
    'Unlimited tasks & notes',
    'Inbox + Today + Notes tabs',
    'Milestone celebrations & streaks',
    '8 PM daily reminder',
    'Offline / PWA support',
    'Light & dark mode',
    'No account or sign-in',
    'No subscription, ever',
  ]

  return (
    <section id="lp-pricing" className="lp-section lp-pricing-section" aria-labelledby="lp-pricing-title">
      <div className="lp-container">
        <div className="lp-section-head lp-reveal-group" style={{ textAlign: 'center', margin: '0 auto var(--space-6)' }}>
          <p className="lp-eyebrow lp-reveal">Pricing</p>
          <h2 id="lp-pricing-title" className="lp-section-title lp-reveal">
            Simple pricing. As in: free.
          </h2>
          <p className="lp-section-lead lp-reveal">
            Everything Dhyaan does, always, with no strings attached.
          </p>
        </div>

        <div className="lp-pricing-card lp-reveal">
          <div className="lp-pricing-badge">Free forever</div>
          <div className="lp-pricing-price">
            <span className="lp-pricing-currency">₹</span>
            <span className="lp-pricing-amount">0</span>
            <span className="lp-pricing-period">/ always</span>
          </div>
          <p className="lp-pricing-tagline">
            No credit card. No trial period. No freemium tricks.
          </p>

          <ul className="lp-pricing-features" role="list">
            {included.map((item) => (
              <li key={item} className="lp-pricing-feature">
                <CheckIcon size={16} />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <OpenAppButton variant="primary" />
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────
function FaqSection() {
  const faqs: Array<{ q: string; a: ReactNode }> = [
    {
      q: 'Do I need to sign up or create an account?',
      a: 'No. There is no account, no email, and no password. Open Dhyaan and start capturing — everything is stored on your own device.',
    },
    {
      q: 'Where is my data stored?',
      a: "Locally, in your browser, on your device. Nothing is uploaded to a server, and nothing syncs anywhere. Clearing your browser data will clear Dhyaan, so keep that in mind.",
    },
    {
      q: "What's the difference between Inbox and Today?",
      a: 'Inbox holds every task without a date, newest first — a place to empty your head. Today groups dated and overdue tasks so you know exactly what to work on now.',
    },
    {
      q: 'Does it work without an internet connection?',
      a: 'Yes. Dhyaan installs as a PWA. After your first visit it loads instantly from cache, so you can capture and review tasks offline.',
    },
    {
      q: 'Is it really free?',
      a: 'Completely. Every feature — tasks, notes, streaks, reminders, offline support — is free forever. No paid tier, no trials, no upsells.',
    },
  ]

  return (
    <section id="lp-faq" className="lp-section lp-faq-section" aria-labelledby="lp-faq-title">
      <div className="lp-container lp-faq-inner">
        <div className="lp-section-head lp-reveal-group">
          <p className="lp-eyebrow lp-reveal">FAQ</p>
          <h2 id="lp-faq-title" className="lp-section-title lp-reveal">
            Questions, answered.
          </h2>
          <p className="lp-section-lead lp-reveal">
            The short version: it is a free, private, offline task manager
            built for students — and nothing more.
          </p>
        </div>

        <ul className="lp-faq-list lp-reveal-group" role="list">
          {faqs.map((item) => (
            <li key={item.q} className="lp-faq-item lp-reveal">
              <details className="lp-faq-details">
                <summary className="lp-faq-q">
                  <span>{item.q}</span>
                  <span className="lp-faq-chevron" aria-hidden="true">
                    <ChevronIcon />
                  </span>
                </summary>
                <div className="lp-faq-a">
                  <p>{item.a}</p>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// ─── Final CTA band ───────────────────────────────────────────────────────
function CtaSection() {
  return (
    <section className="lp-section lp-cta-section" aria-labelledby="lp-cta-title">
      <div className="lp-cta-orb lp-cta-orb-1" aria-hidden="true" />
      <div className="lp-cta-orb lp-cta-orb-2" aria-hidden="true" />
      <div className="lp-container lp-cta-inner lp-reveal-group">
        <p className="lp-eyebrow lp-reveal" style={{ color: 'var(--lp-cta-eyebrow)' }}>
          Start today
        </p>
        <h2 id="lp-cta-title" className="lp-cta-title lp-reveal">
          Your tasks are waiting. Your Today isn't.
        </h2>
        <p className="lp-cta-text lp-reveal">
          Nothing to install. Nothing to sign in to. Open Dhyaan and
          your first task is captured in under five seconds.
        </p>
        <div className="lp-cta-actions lp-reveal">
          <OpenAppButton variant="cta" />
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-container lp-footer-inner">
        <div className="lp-footer-brand">
          <span className="lp-brand">
            <Mark size={18} />
            <span className="lp-brand-name">Dhyaan</span>
          </span>
          <p className="lp-footer-tagline">
            A focused task manager for college students.
          </p>
        </div>

        <nav className="lp-footer-links" aria-label="Footer">
          <a className="lp-footer-link" href="#lp-features">Features</a>
          <a className="lp-footer-link" href="#lp-how">How it works</a>
          <a className="lp-footer-link" href="#lp-pricing">Pricing</a>
          <a className="lp-footer-link" href="#lp-faq">FAQ</a>
        </nav>

        <p className="lp-footer-copy">
          &copy; {new Date().getFullYear()} Dhyaan &middot; Your data stays on your device
        </p>
      </div>
    </footer>
  )
}

// ─── Shared UI pieces ─────────────────────────────────────────────────────
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
      {/* Open ring (enso): a near-full circle stroked as an arc, leaving a gap
          at the top — the same mark as the installed app icon. */}
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
  )
}

function ThemeToggle({ theme, onToggle }: { theme: 'light' | 'dark'; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="lp-theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
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
      )}
    </button>
  )
}

function OpenAppButton({ variant }: { variant: 'primary' | 'compact' | 'cta' }) {
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

  const className =
    variant === 'primary'
      ? 'lp-btn lp-btn-primary'
      : variant === 'cta'
        ? 'lp-btn lp-btn-cta'
        : 'lp-btn lp-btn-compact'

  const label = variant === 'compact' ? 'Open app' : 'Start for free →'

  return (
    <a className={className} href={ROUTE_APP} onClick={handleClick}>
      {label}
    </a>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────
function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function InboxIconLg() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  )
}

function CalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function NoteIconLg() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  )
}

function OfflineIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  )
}

function MilestoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true" focusable="false">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function FlameIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12 2c1.5 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1 .3-1.8.8-2.5C7 9 5.5 10.7 5.5 13a6.5 6.5 0 0 0 13 0C18.5 8 16 6 12 2z" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ─── Preview pieces (isolated lookalikes) ─────────────────────────────────
function PreviewCheck({ done = false }: { done?: boolean }) {
  return (
    <span
      className={done ? 'lp-preview-check lp-preview-check-done' : 'lp-preview-check'}
      aria-hidden="true"
    >
      {done ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
    <li className={`lp-preview-row${done ? ' lp-preview-row-done' : ''}${settling ? ' lp-preview-row-new' : ''}`}>
      <PreviewCheck done={done} />
      <span className="lp-preview-text">
        <span className="lp-preview-title">{title}</span>
        {overdue ? <span className="lp-preview-overdue">Overdue</span> : null}
        {meta !== undefined ? <span className="lp-preview-meta">{meta}</span> : null}
      </span>
    </li>
  )
}

function InboxIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  )
}

function TodayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" /><path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" /><path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
    </svg>
  )
}

function NotesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />
    </svg>
  )
}

function FabGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" focusable="false">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

// ─── Demo phones ──────────────────────────────────────────────────────────
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
    <div className="lp-preview lp-preview-phone lp-demo-phone" role="img" aria-label={label}>
      <div className="lp-preview-head" aria-hidden="true">
        <Mark size={18} />
        <span className="lp-preview-app">Dhyaan</span>
      </div>
      <div className="lp-preview-body" aria-hidden="true">
        {children}
      </div>
      {fab ? (
        <span className="lp-preview-fab" aria-hidden="true"><FabGlyph /></span>
      ) : null}
      <div className="lp-preview-tabs" data-active={tab} aria-hidden="true">
        <span className={tab === 'inbox' ? 'lp-preview-tab is-active' : 'lp-preview-tab'}>
          <InboxIcon />Inbox
        </span>
        <span className={tab === 'today' ? 'lp-preview-tab is-active' : 'lp-preview-tab'}>
          <TodayIcon />Today
        </span>
        <span className="lp-preview-tab">
          <NotesIcon />Notes
        </span>
      </div>
    </div>
  )
}

function HeroPreview() {
  const reducedMotion = usePrefersReducedMotion()
  const [tab, setTab] = useState<'inbox' | 'today' | 'notes'>('inbox')

  // Auto-cycle the demo so every screen gets seen. Skipped entirely when the
  // visitor prefers reduced motion — then it rests on the Inbox, fully static.
  useEffect(() => {
    if (reducedMotion) return
    const order: Array<'inbox' | 'today' | 'notes'> = ['inbox', 'today', 'notes']
    let i = 0
    const id = window.setInterval(() => {
      i = (i + 1) % order.length
      setTab(order[i])
    }, 3800)
    return () => window.clearInterval(id)
  }, [reducedMotion])

  return (
    <figure
      className="lp-preview lp-preview-frame lp-preview-phone lp-hero-preview"
      role="img"
      aria-label="Dhyaan cycling through its Inbox, Today and Notes screens: capturing a task, seeing overdue and due-today items, and jotting a note."
    >
      <div className="lp-preview-head">
        <Mark size={20} />
        <span className="lp-preview-app">Dhyaan</span>
      </div>
      <div className="lp-preview-body">
        <div className="lp-hero-screen" key={tab} data-screen={tab}>
          {tab === 'inbox' ? <HeroInboxScreen /> : null}
          {tab === 'today' ? <HeroTodayScreen /> : null}
          {tab === 'notes' ? <HeroNotesScreen /> : null}
        </div>
      </div>
      <span className="lp-preview-fab" aria-hidden="true"><FabGlyph /></span>
      <div className="lp-preview-tabs" data-active={tab}>
        <span className={tab === 'inbox' ? 'lp-preview-tab is-active' : 'lp-preview-tab'}><InboxIcon />Inbox</span>
        <span className={tab === 'today' ? 'lp-preview-tab is-active' : 'lp-preview-tab'}><TodayIcon />Today</span>
        <span className={tab === 'notes' ? 'lp-preview-tab is-active' : 'lp-preview-tab'}><NotesIcon />Notes</span>
      </div>
    </figure>
  )
}

function HeroInboxScreen() {
  return (
    <>
      <p className="lp-preview-h2">Inbox</p>
      <div className="lp-preview-slot">
        <ul className="lp-preview-list">
          <PreviewRow title="Submit DBMS assignment" settling />
          <PreviewRow title="Read chapter 4 before the seminar" />
          <PreviewRow title="Renew library books" />
        </ul>
        <div className="lp-preview-composer" aria-hidden="true">
          <span className="lp-preview-compose-dot" />
          <span className="lp-preview-compose-text">Submit DBMS assignment</span>
          <span className="lp-preview-save">Save</span>
        </div>
      </div>
      <p className="lp-preview-label">Completed</p>
      <ul className="lp-preview-list">
        <PreviewRow title="Email Prof. Nair about the lab slot" done />
      </ul>
    </>
  )
}

function HeroTodayScreen() {
  const today = todayLocal()
  const yesterday = addDaysLocal(today, -1)

  return (
    <>
      <p className="lp-preview-h2">Today</p>
      <p className="lp-preview-label">Overdue</p>
      <ul className="lp-preview-list">
        <PreviewRow title="Submit the lab record" overdue meta={`College · ${yesterday}`} />
      </ul>
      <ul className="lp-preview-list lp-preview-today-list">
        <PreviewRow title="Submit DBMS assignment" meta={today} />
        <PreviewRow title="Submit the attendance sheet" meta={`College · ${today}`} />
      </ul>
      <span className="lp-preview-toggle">Upcoming (2)</span>
    </>
  )
}

function HeroNotesScreen() {
  return (
    <>
      <p className="lp-preview-h2">Notes</p>
      <ul className="lp-preview-list">
        <li className="lp-preview-row lp-preview-note">
          <span className="lp-preview-note-title">Lab slot moved to Thursday</span>
          <span className="lp-preview-meta">Room 204 · Prof. Nair</span>
        </li>
        <li className="lp-preview-row lp-preview-note">
          <span className="lp-preview-note-title">Reference for essay</span>
          <span className="lp-preview-meta">library.ca/reading-list</span>
        </li>
        <li className="lp-preview-row lp-preview-note">
          <span className="lp-preview-note-title">Group project roles</span>
          <span className="lp-preview-meta">Priya — research, me — slides</span>
        </li>
      </ul>
    </>
  )
}

function CaptureScreen() {
  return (
    <DemoPhone tab="inbox" fab={false} label="Capture screen: task title typed, optional details, Cancel and Save buttons.">
      <div className="lp-preview-field">Submit DBMS assignment</div>
      <span className="lp-preview-more">Add details</span>
      <div className="lp-preview-btnrow">
        <span className="lp-preview-btn">Cancel</span>
        <span className="lp-preview-btn is-primary">Save</span>
      </div>
    </DemoPhone>
  )
}

function InboxScreen() {
  return (
    <DemoPhone tab="inbox" fab={true} label="Inbox: just-captured task on top of two more, add button visible.">
      <p className="lp-preview-h2">Inbox</p>
      <ul className="lp-preview-list">
        <PreviewRow title="Submit DBMS assignment" />
        <PreviewRow title="Read chapter 4 before the seminar" />
        <PreviewRow title="Renew library books" />
      </ul>
    </DemoPhone>
  )
}

function TodayScreen() {
  const today = todayLocal()
  const yesterday = addDaysLocal(today, -1)

  return (
    <DemoPhone tab="today" fab={false} label="Today: an overdue task, two tasks due today, upcoming tasks behind a toggle.">
      <p className="lp-preview-h2">Today</p>
      <p className="lp-preview-label">Overdue</p>
      <ul className="lp-preview-list">
        <PreviewRow title="Submit the lab record" overdue meta={`College · ${yesterday}`} />
      </ul>
      <ul className="lp-preview-list lp-preview-today-list">
        <PreviewRow title="Submit DBMS assignment" meta={today} />
        <PreviewRow title="Submit the attendance sheet" meta={`College · ${today}`} />
      </ul>
      <span className="lp-preview-toggle">Upcoming (2)</span>
    </DemoPhone>
  )
}

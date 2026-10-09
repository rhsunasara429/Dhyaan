import React from 'react';
import './LandingPage.css';
import { AppPreview } from '../AppPreview';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

const NavLink = ({ href, children }: NavLinkProps) => (
  <a href={href} className="nav-link">{children}</a>
);

export const LandingPage = ({ onTryDhyaan }: { onTryDhyaan: () => void }) => {
  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="nav-logo-group">
          <svg className="logo-mark" width="24" height="24" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="5"/>
            <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" strokeWidth="4"/>
            <circle cx="50" cy="50" r="10" fill="var(--color-accent)"/>
          </svg>
          <span className="nav-logo-text">Dhyaan</span>
        </div>
        <div className="nav-links">
          <NavLink href="#experience">Experience</NavLink>
          <NavLink href="#benefits">Benefits</NavLink>
          <button onClick={onTryDhyaan} className="nav-cta">Try Dhyaan</button>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Get your thoughts out of your head.</h1>
          <p className="hero-subtitle">
            Dhyaan is a calm, focused space to capture tasks and notes the moment they appear,
            so you can stop remembering and start doing.
          </p>
          <div className="hero-actions">
            <button onClick={onTryDhyaan} className="btn-primary">Try Dhyaan</button>
          </div>
        </div>
        <div className="hero-visual">
          <AppPreview />
        </div>
      </header>

      <section id="experience" className="experience">
        <div className="section-header">
          <h2>The Workflow</h2>
          <p>From noise to clarity in four simple steps.</p>
        </div>
        <div className="workflow-grid">
          <div className="workflow-item">
            <div className="workflow-number">01</div>
            <h3>Capture</h3>
            <p>Jot down tasks and notes instantly. No friction, no complex folders.</p>
          </div>
          <div className="workflow-item">
            <div className="workflow-number">02</div>
            <h3>Organize</h3>
            <p>Differentiate between your general inbox and what needs attention today.</p>
          </div>
          <div className="workflow-item">
            <div className="workflow-number">03</div>
            <h3>Decide</h3>
            <p>Look at your "Today" list and decide what actually matters right now.</p>
          </div>
          <div className="workflow-item">
            <div className="workflow-number">04</div>
            <h3>Complete</h3>
            <p>Feel the satisfaction of checking off your goals with mindful feedback.</p>
          </div>
        </div>
      </section>

      <section id="benefits" className="benefits">
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">☁️</div>
            <h3>Reduced Mental Load</h3>
            <p>Stop using your brain as a to-do list. Offload everything to Dhyaan and breathe.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">🎯</div>
            <h3>Laser Focus</h3>
            <p>By separating "Inbox" from "Today", you eliminate the noise of future tasks.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">📝</div>
            <h3>Quick Notes</h3>
            <p>More than just tasks. Keep your fleeting ideas and useful snippets accessible.</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo-group">
            <svg className="logo-mark" width="20" height="20" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="5"/>
              <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" strokeWidth="4"/>
              <circle cx="50" cy="50" r="10" fill="var(--color-accent)"/>
            </svg>
            <span>Dhyaan</span>
          </div>
          <p>© {new Date().getFullYear()} Dhyaan. Built for focus.</p>
        </div>
      </footer>
    </div>
  );
};

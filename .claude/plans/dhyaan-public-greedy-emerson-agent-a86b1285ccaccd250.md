# Landing Page Design & Implementation Plan for Dhyaan

## 1. Architecture & App Entry
To transition from the landing page to the app without introducing a complex router (consistent with existing architecture), we will implement a top-level state toggle in `App.tsx`.

### App-Entry Structure
- **State Variable**: `view` state in `App.tsx` with values `'landing'` or `'app'`.
- **Conditional Rendering**:
  ```tsx
  return (
    <>
      {view === 'landing' ? <LandingPage onTryDhyaan={() => setView('app')} /> : <MainApp />}
    </>
  )
  ```
- **Persistence**: Since `localStorage` is handled by hooks (`useTasks`, `useNotes`), it is naturally preserved across this state toggle as the React tree for the app is simply mounted/unmounted within the same session.

## 2. User Journey & Page Sections
The landing page will be a single-page scroll experience designed to build mental desire for "clarity."

### Proposed Sections
1. **Navigation**:
   - Left: Logo + "Dhyaan"
   - Right: Links to "How it works", "Benefits", and a primary "Try Dhyaan" CTA.
2. **Hero Section**:
   - **Headline**: "Reclaim your mental space."
   - **Sub-headline**: "A minimal system to capture the noise, organize the chaos, and decide what truly matters."
   - **CTA**: "Try Dhyaan" (Triggers `setView('app')`).
   - **Visual**: A high-fidelity, animated mock-up of the app interface.
3. **Product Experience (The Workflow)**:
   - A series of "Feature Cards" that animate as they enter the viewport:
     - **Capture**: Animation showing a task being quickly added via the FAB.
     - **Organize**: Transitioning from Inbox to Today/Upcoming.
     - **Decide**: The feeling of checking off a task and the "celebration" effect.
     - **Complete**: The "Today is clear" state.
4. **Benefits Section**:
   - Three-column layout focusing on:
     - *Reduced Cognitive Load*: Stop trying to remember everything.
     - *Focus on Now*: Today view filters out future noise.
     - *Calm Execution*: No complex tags or folders, just a flow.
5. **Final CTA & Footer**:
   - Centered "Ready for clarity?" headline.
   - Final "Try Dhyaan" button.
   - Minimal footer with credits and identity.

## 3. Visual & Animation Direction
Following the "Premium, Calm, Modern" direction.

### Implementation Approach
- **CSS-Only Animations**: Use `@keyframes` and `transition` to avoid external libraries.
- **Scroll Reveals**: Use `IntersectionObserver` in a small custom hook (`useIntersectionObserver`) to add a `.visible` class to sections.
- **Product Preview**: Instead of screenshots, we will build "Mini-App" components—simplified, read-only versions of the existing `TaskRow` and `NoteRow`—wrapped in a "Phone Frame" CSS container. This ensures the preview always matches the actual app design.
- **Entrance Motion**:
  - Hero: Subtle fade-in and slide-up (Y: 20px $\rightarrow$ 0).
  - Sections: Staggered entrance for cards.

## 4. Technical Implementation Details

### Files to Create/Modify
- `src/components/LandingPage.tsx`: The main container for the landing page.
- `src/components/LandingSection.tsx`: A reusable wrapper for scroll-reveal sections.
- `src/components/AppPreview.tsx`: The animated product demo (using simplified app components).
- `src/App.tsx`: Modify to include `view` state and conditional rendering.
- `src\styles.css`: Add landing-page specific styles (grid layouts, hero typography, animation keyframes).

### Accessibility & Reduced Motion
- **`prefers-reduced-motion`**: All landing page animations will be wrapped in the existing media query in `styles.css` to ensure they are disabled or simplified.
- **A11y**: Semantic HTML (`<header>`, `<main>`, `<section>`, `<footer>`), proper `aria-label` for CTAs, and maintaining high contrast using existing tokens.

## 5. Risks & Mitigations
- **PWA**: The landing page is part of the same PWA bundle. It will be cached by the SW, ensuring instant loads.
- **LocalStorage**: No risk; the app logic remains separate from the view logic.
- **Bundle Size**: By avoiding Framer Motion/GSAP, we keep the bundle extremely lean.

## 6. Testing & Verification
1. **Visual Regression**: Verify the "Phone Frame" preview scales correctly on mobile/desktop.
2. **Interaction**: Ensure "Try Dhyaan" buttons in both Hero and Footer trigger the app view.
3. **Performance**: Check for layout shifts during scroll-reveal animations.
4. **A11y**: Tab-navigation through the landing page to the app entry.

## 7. Assumptions for Approval
- No requirement for a separate `/landing` URL; state-based toggle is acceptable.
- Existing CSS variables are sufficient for the "Premium" feel.
- Simplified "Mini-App" components are preferred over static images for the preview.

import { useEffect, useSyncExternalStore } from 'react'
import App from './App.tsx'
import LandingPage from './LandingPage.tsx'
import { currentRoute, subscribe, type Route } from './routes.ts'

const TITLES: Record<Route, string> = {
  landing: 'Dhyaan — capture college tasks and work through them today',
  app: 'Dhyaan',
}

/**
 * Chooses a surface from the URL and keeps it in step with the back
 * button. The app is mounted whole, untouched, at /app; the landing page
 * is mounted whole at / and at any path it does not own. Switching routes
 * unmounts one and mounts the other, which is why nothing is shared across
 * them: each one owns its own state, its own CSS scope, and its own hooks.
 */
export default function Root() {
  const route = useSyncExternalStore(subscribe, currentRoute, currentRoute)

  // One index.html serves both routes, so the title is the only piece of
  // per-route metadata that can change here. The meta description stays as
  // declared in index.html.
  useEffect(() => {
    document.title = TITLES[route]
  }, [route])

  // A landing page scrolled to the footer should not open the app halfway
  // down. Runs on mount too, where it is a no-op.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  return route === 'landing' ? <LandingPage /> : <App />
}
/**
 * Minimal two-route navigation.
 *
 * Dhyaan has exactly two surfaces: the public landing page and the app.
 * A routing library would be a dependency we do not need, so the URL is
 * treated as a small external store: `useSyncExternalStore` in Root.tsx
 * subscribes to it, `popstate` keeps back/forward honest, and `navigate`
 * pushes history without reloading the document.
 *
 * Two Dhyaan surfaces, one rule: everything that is not exactly /app is
 * the landing page. Unknown paths render it *without* rewriting the URL,
 * so a mistyped link shows a real page instead of a dead end, and the
 * address bar still tells the truth about what was requested.
 */

export const ROUTE_LANDING = '/'
export const ROUTE_APP = '/app'

export type Route = 'landing' | 'app'

type Listener = () => void

const listeners = new Set<Listener>()

/**
 * Collapse the variations a browser or a link can hand us into a single
 * comparable path: no query, no hash, no duplicate or trailing slashes,
 * lowercase, and the `/index.html` that the service worker precaches
 * folded onto the root it serves.
 */
export function normalizePathname(pathname: string): string {
  let path = pathname.split('?')[0].split('#')[0]
  if (path === '') return ROUTE_LANDING
  if (!path.startsWith('/')) path = `/${path}`
  path = path.replace(/\/{2,}/g, '/').replace(/\/+$/, '')
  if (path === '') return ROUTE_LANDING
  const lower = path.toLowerCase()
  return lower === '/index.html' ? ROUTE_LANDING : lower
}

/** The landing page owns everything that is not the app. */
export function resolveRoute(pathname: string): Route {
  return normalizePathname(pathname) === ROUTE_APP ? 'app' : 'landing'
}

/** Reads the live URL. Safe to call outside a browser. */
export function currentRoute(): Route {
  if (typeof window === 'undefined') return 'landing'
  return resolveRoute(window.location.pathname)
}

function emit() {
  // Copy first: a listener may unsubscribe while we iterate.
  for (const listener of Array.from(listeners)) listener()
}

function handlePopState() {
  emit()
}

let popStateAttached = false

function attachPopState() {
  if (popStateAttached || typeof window === 'undefined') return
  window.addEventListener('popstate', handlePopState)
  popStateAttached = true
}

function detachPopState() {
  if (!popStateAttached || typeof window === 'undefined') return
  window.removeEventListener('popstate', handlePopState)
  popStateAttached = false
}

/**
 * Registers a listener for URL changes. The popstate listener is attached
 * on the first subscriber and removed with the last one, so mounting and
 * unmounting leaves no global handler behind. The returned cleanup is
 * idempotent, which keeps it safe under StrictMode's double invoke.
 */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  if (listeners.size === 1) attachPopState()
  let active = true
  return () => {
    if (!active) return
    active = false
    listeners.delete(listener)
    if (listeners.size === 0) detachPopState()
  }
}

/**
 * Moves between routes without a document reload. Normalises the target
 * so `/app/` and `/app` cannot create a duplicate history entry, and skips
 * the history call entirely when we are already there. Unknown targets are
 * left in the URL, matching resolveRoute.
 */
export function navigate(to: string, options: { replace?: boolean } = {}): void {
  if (typeof window === 'undefined') return
  const target = normalizePathname(to)
  if (window.location.pathname !== target) {
    if (options.replace) window.history.replaceState(null, '', target)
    else window.history.pushState(null, '', target)
  }
  emit()
}
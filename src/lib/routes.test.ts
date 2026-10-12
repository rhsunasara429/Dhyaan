import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ROUTE_APP,
  ROUTE_LANDING,
  currentRoute,
  navigate,
  normalizePathname,
  resolveRoute,
  subscribe,
} from './routes.ts'

interface FakeHistory {
  pushState(data: unknown, unused: string, url: string): void
  replaceState(data: unknown, unused: string, url: string): void
}

interface FakeWindow {
  location: { pathname: string }
  history: FakeHistory
  addEventListener(type: string, listener: () => void): void
  removeEventListener(type: string, listener: () => void): void
}

function createFakeWindow(initialPath: string) {
  const popstateListeners = new Set<() => void>()
  const calls: { method: string; url: string }[] = []

  const win: FakeWindow = {
    location: { pathname: initialPath },
    history: {
      pushState(_data: unknown, _unused: string, url: string) {
        calls.push({ method: 'pushState', url })
        win.location.pathname = url
      },
      replaceState(_data: unknown, _unused: string, url: string) {
        calls.push({ method: 'replaceState', url })
        win.location.pathname = url
      },
    },
    addEventListener(type: string, listener: () => void) {
      if (type === 'popstate') popstateListeners.add(listener)
    },
    removeEventListener(type: string, listener: () => void) {
      if (type === 'popstate') popstateListeners.delete(listener)
    },
  }

  return {
    win,
    calls,
    popstateListenerCount: () => popstateListeners.size,
    // Simulates the user pressing Back: the browser rewrites the URL,
    // then fires popstate. The app never sees a reload.
    back(to: string) {
      win.location.pathname = to
      for (const listener of Array.from(popstateListeners)) listener()
    },
  }
}

const cleanups: (() => void)[] = []

afterEach(() => {
  while (cleanups.length > 0) cleanups.pop()?.()
  vi.unstubAllGlobals()
})

function mount(fake: ReturnType<typeof createFakeWindow>) {
  vi.stubGlobal('window', fake.win)
  return {
    onUrlChange(listener: () => void) {
      const stop = subscribe(listener)
      cleanups.push(stop)
      return stop
    },
  }
}

describe('normalizePathname', () => {
  it('leaves the two real routes alone', () => {
    expect(normalizePathname(ROUTE_LANDING)).toBe(ROUTE_LANDING)
    expect(normalizePathname(ROUTE_APP)).toBe(ROUTE_APP)
  })

  it('drops the query string and the hash', () => {
    expect(normalizePathname('/app?tab=today')).toBe(ROUTE_APP)
    expect(normalizePathname('/app#notes')).toBe(ROUTE_APP)
    expect(normalizePathname('/?utm=student')).toBe(ROUTE_LANDING)
  })

  it('collapses duplicate and trailing slashes', () => {
    expect(normalizePathname('/app/')).toBe(ROUTE_APP)
    expect(normalizePathname('//app//')).toBe(ROUTE_APP)
  })

  it('adds a leading slash when one is missing', () => {
    expect(normalizePathname('app')).toBe(ROUTE_APP)
  })

  it('lowercases so casing differences are not new pages', () => {
    expect(normalizePathname('/APP')).toBe(ROUTE_APP)
    expect(normalizePathname('/App')).toBe(ROUTE_APP)
  })

  it('folds /index.html onto the root it serves', () => {
    expect(normalizePathname('/index.html')).toBe(ROUTE_LANDING)
    expect(normalizePathname('/index.html?x=1')).toBe(ROUTE_LANDING)
  })

  it('treats empty and slash-only paths as the landing page', () => {
    expect(normalizePathname('')).toBe(ROUTE_LANDING)
    expect(normalizePathname('/')).toBe(ROUTE_LANDING)
    expect(normalizePathname('///')).toBe(ROUTE_LANDING)
  })

  it('preserves unknown paths so the URL is not rewritten', () => {
    expect(normalizePathname('/pricing')).toBe('/pricing')
    expect(normalizePathname('/app/extra')).toBe('/app/extra')
  })
})

describe('resolveRoute', () => {
  it('maps the two real routes', () => {
    expect(resolveRoute('/')).toBe('landing')
    expect(resolveRoute('/app')).toBe('app')
  })

  it('gives the app to /app however it is spelled', () => {
    expect(resolveRoute('/app/')).toBe('app')
    expect(resolveRoute('/APP')).toBe('app')
    expect(resolveRoute('/index.html')).toBe('landing')
  })

  it('renders unknown paths as the landing page', () => {
    expect(resolveRoute('/pricing')).toBe('landing')
    expect(resolveRoute('/app/tasks')).toBe('landing')
    expect(resolveRoute('/nope?x=1')).toBe('landing')
  })
})

describe('currentRoute', () => {
  it('reads the live URL', () => {
    const fake = createFakeWindow('/app')
    mount(fake)
    expect(currentRoute()).toBe('app')
  })

  it('falls back to the landing page with no browser', () => {
    vi.stubGlobal('window', undefined)
    expect(currentRoute()).toBe('landing')
  })
})

describe('navigate', () => {
  it('pushes a history entry by default', () => {
    const fake = createFakeWindow('/')
    mount(fake)
    navigate(ROUTE_APP)
    expect(fake.calls).toEqual([{ method: 'pushState', url: '/app' }])
    expect(currentRoute()).toBe('app')
  })

  it('replaces the history entry when asked', () => {
    const fake = createFakeWindow('/')
    mount(fake)
    navigate(ROUTE_APP, { replace: true })
    expect(fake.calls).toEqual([{ method: 'replaceState', url: '/app' }])
    expect(currentRoute()).toBe('app')
  })

  it('normalises the target before touching history', () => {
    const fake = createFakeWindow('/')
    mount(fake)
    navigate('/app/?tab=today')
    expect(fake.calls).toEqual([{ method: 'pushState', url: '/app' }])
  })

  it('does nothing to history when already on the target', () => {
    const fake = createFakeWindow('/app')
    const listener = vi.fn()
    mount(fake).onUrlChange(listener)
    navigate(ROUTE_APP)
    expect(fake.calls).toEqual([])
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('leaves unknown targets in the URL rather than rewriting them', () => {
    const fake = createFakeWindow('/')
    mount(fake)
    navigate('/pricing')
    expect(fake.calls).toEqual([{ method: 'pushState', url: '/pricing' }])
    expect(fake.win.location.pathname).toBe('/pricing')
    expect(currentRoute()).toBe('landing')
  })
})

describe('subscribe', () => {
  it('notifies on navigate', () => {
    const fake = createFakeWindow('/')
    const listener = vi.fn()
    mount(fake).onUrlChange(listener)
    navigate(ROUTE_APP)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('notifies on browser back and forward', () => {
    const fake = createFakeWindow('/app')
    const listener = vi.fn()
    mount(fake).onUrlChange(listener)
    fake.back(ROUTE_LANDING)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(currentRoute()).toBe('landing')
  })

  it('notifies every subscriber', () => {
    const fake = createFakeWindow('/')
    mount(fake)
    const first = vi.fn()
    const second = vi.fn()
    cleanups.push(subscribe(first), subscribe(second))
    navigate(ROUTE_APP)
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('stops notifying after unsubscribe', () => {
    const fake = createFakeWindow('/')
    const listener = vi.fn()
    const stop = mount(fake).onUrlChange(listener)
    stop()
    navigate(ROUTE_APP)
    expect(listener).not.toHaveBeenCalled()
  })

  it('ignores a repeated cleanup so StrictMode remounts are safe', () => {
    const fake = createFakeWindow('/')
    const stop = mount(fake).onUrlChange(vi.fn())
    stop()
    expect(() => stop()).not.toThrow()
    const listener = vi.fn()
    cleanups.push(subscribe(listener))
    navigate(ROUTE_APP)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('attaches one popstate listener and removes it with the last subscriber', () => {
    const fake = createFakeWindow('/')
    mount(fake)
    const first = subscribe(vi.fn())
    const second = subscribe(vi.fn())
    expect(fake.popstateListenerCount()).toBe(1)
    first()
    expect(fake.popstateListenerCount()).toBe(1)
    second()
    expect(fake.popstateListenerCount()).toBe(0)
  })
})
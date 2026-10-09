import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('dhyaan.theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dhyaan.theme', theme);

    // Update theme-color meta tags.
    //
    // index.html declares a light/dark pair gated on prefers-color-scheme so
    // the status bar is right on first paint, before this effect runs. Once
    // JS is in charge we drop the media gating and pin every meta to the
    // chosen theme. Leaving the media attributes in place means the
    // dark-scheme meta keeps winning regardless of what the user picked.
    const content = theme === 'dark' ? '#0d1117' : '#ffffff';
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.removeAttribute('media');
      meta.setAttribute('content', content);
    });
  }, [theme]);

  // Listen for system preference changes (if user hasn't explicitly overridden)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('dhyaan.theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return { theme, toggleTheme };
}

'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

// Must match the key and default in app/layout.tsx's pre-paint theme script.
export const THEME_STORAGE_KEY = 'ag-theme'

// The icon is picked by CSS from <html data-theme>, so it is right on first paint;
// only the label waits for the effect (the server always renders the dark default).
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light')
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Storage blocked (private mode): the choice just doesn't persist.
    }
    setTheme(next)
  }

  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label={label} title={label}>
      <Sun className="icon-sun" size={16} strokeWidth={1.5} aria-hidden />
      <Moon className="icon-moon" size={16} strokeWidth={1.5} aria-hidden />
    </button>
  )
}

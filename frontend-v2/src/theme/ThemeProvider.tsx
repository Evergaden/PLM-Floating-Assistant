import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ThemeId } from '../types'

export type ThemeOption = {
  id: ThemeId
  label: string
  description: string
  swatch: string
}

export const themeOptions: ThemeOption[] = [
  { id: 'violet', label: '薰衣草紫', description: '当前默认', swatch: '#7056e8' },
  { id: 'ocean', label: '海盐蓝', description: '清爽冷调', swatch: '#3778d8' },
  { id: 'mint', label: '薄荷青', description: '轻盈自然', swatch: '#2fae9d' },
  { id: 'rose', label: '玫瑰粉', description: '柔和暖调', swatch: '#d66b91' },
]

type ThemeContextValue = {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
  options: ThemeOption[]
}

const THEME_STORAGE_KEY = 'plm-frontend-v2-theme'
const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): ThemeId {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored && themeOptions.some((option) => option.id === stored)) return stored as ThemeId
  } catch {
    // Storage can be unavailable in a restricted userscript sandbox.
  }
  return 'violet'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeId>(readStoredTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector<HTMLElement>('[data-plm-v2-theme-host]')?.setAttribute('data-theme', theme)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // The visual theme still works for the current session.
    }
  }, [theme])

  const value = useMemo(() => ({ theme, setTheme, options: themeOptions }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}

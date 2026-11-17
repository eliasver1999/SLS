import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Theme = 'dark' | 'light'

type ThemeValue = {
  theme: Theme
  setTheme: (t: Theme) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeValue | null>(null)

const STORAGE_KEY = 'sls.theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Light by default: it is the storefront's palette, so signing in no longer
  // drops you from a stone-coloured site into a near-black one. Dark stays a
  // choice, remembered per browser.
  const [theme, setThemeState] = useState<Theme>(() =>
    localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light',
  )

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    localStorage.setItem(STORAGE_KEY, t)
  }, [])

  const toggle = useCallback(
    () => setTheme(theme === 'light' ? 'dark' : 'light'),
    [theme, setTheme],
  )

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

/**
 * Applies the chosen theme to <body> for as long as the calling screen is
 * mounted, and removes it on the way out.
 *
 * The storefront is always light. Dark mode is the signed-in tooling's
 * option, so this is mounted from the dashboard and the admin only.
 */
export function useApplyTheme() {
  const { theme } = useTheme()

  useEffect(() => {
    document.body.dataset.theme = theme
    return () => {
      delete document.body.dataset.theme
    }
  }, [theme])
}

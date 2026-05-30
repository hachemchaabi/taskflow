import { createContext, useCallback, useEffect, useReducer } from 'react'
import type { ReactNode } from 'react'
import { themeReducer } from './themeSlice'
import type { Theme } from './themeSlice'
import { THEME_STORAGE_KEY } from '../../../shared/utils/constants'
import { readString, writeString } from '../../../shared/utils/localStorage'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const DARK_QUERY = '(prefers-color-scheme: dark)'

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
  }
  return theme
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', resolveTheme(theme) === 'dark')
}

function readStoredTheme(): Theme {
  const stored = readString(THEME_STORAGE_KEY)
  return stored === 'dark' || stored === 'system' ? stored : 'light'
}

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(themeReducer, undefined, () => ({
    theme: readStoredTheme(),
  }))

  useEffect(() => {
    applyTheme(state.theme)
    writeString(THEME_STORAGE_KEY, state.theme)
    if (state.theme !== 'system') return
    const media = window.matchMedia(DARK_QUERY)
    const onChange = () => applyTheme('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [state.theme])

  const setTheme = useCallback((theme: Theme) => {
    dispatch({ type: 'SET_THEME', payload: theme })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme: state.theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

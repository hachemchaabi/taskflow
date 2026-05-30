export type Theme = 'light' | 'dark' | 'system'

export interface ThemeState {
  theme: Theme
}

export type ThemeAction = { type: 'SET_THEME'; payload: Theme }

export const initialThemeState: ThemeState = { theme: 'light' }

export function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case 'SET_THEME':
      return { theme: action.payload }
    default:
      return state
  }
}

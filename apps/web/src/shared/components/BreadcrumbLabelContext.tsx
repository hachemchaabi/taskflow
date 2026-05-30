import { createContext, useCallback, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'

type BreadcrumbLabel = string | null

interface BreadcrumbLabelState {
  labels: Record<string, BreadcrumbLabel>
}

type BreadcrumbLabelAction =
  | { type: 'SET'; key: string; label: string }
  | { type: 'PENDING'; key: string }
  | { type: 'CLEAR'; key: string }

function reducer(state: BreadcrumbLabelState, action: BreadcrumbLabelAction): BreadcrumbLabelState {
  switch (action.type) {
    case 'SET':
      if (state.labels[action.key] === action.label) return state
      return { labels: { ...state.labels, [action.key]: action.label } }
    case 'PENDING':
      if (action.key in state.labels) return state
      return { labels: { ...state.labels, [action.key]: null } }
    case 'CLEAR': {
      if (!(action.key in state.labels)) return state
      const { [action.key]: _removed, ...rest } = state.labels
      return { labels: rest }
    }
    default:
      return state
  }
}

interface BreadcrumbLabelContextValue {
  labels: Record<string, BreadcrumbLabel>
  setLabel: (key: string, label: string) => void
  markPending: (key: string) => void
  clearLabel: (key: string) => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const BreadcrumbLabelContext = createContext<BreadcrumbLabelContextValue | null>(null)

export function BreadcrumbLabelProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { labels: {} })

  const setLabel = useCallback((key: string, label: string) => {
    dispatch({ type: 'SET', key, label })
  }, [])

  const markPending = useCallback((key: string) => {
    dispatch({ type: 'PENDING', key })
  }, [])

  const clearLabel = useCallback((key: string) => {
    dispatch({ type: 'CLEAR', key })
  }, [])

  const value = useMemo(
    () => ({ labels: state.labels, setLabel, markPending, clearLabel }),
    [state.labels, setLabel, markPending, clearLabel],
  )

  return <BreadcrumbLabelContext.Provider value={value}>{children}</BreadcrumbLabelContext.Provider>
}

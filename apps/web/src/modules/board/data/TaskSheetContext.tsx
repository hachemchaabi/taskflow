import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type SheetState =
  | { mode: 'closed' }
  | { mode: 'create'; listId?: string }
  | { mode: 'view'; cardId: string }

interface TaskSheetValue {
  state: SheetState
  openCreate: (listId?: string) => void
  openCard: (cardId: string) => void
  close: () => void
}

const TaskSheetContext = createContext<TaskSheetValue | null>(null)

export function TaskSheetProvider({
  children,
  initialCardId,
}: {
  children: ReactNode
  initialCardId?: string
}) {
  const [state, setState] = useState<SheetState>({ mode: 'closed' })
  const openCreate = useCallback((listId?: string) => setState({ mode: 'create', listId }), [])
  const openCard = useCallback((cardId: string) => setState({ mode: 'view', cardId }), [])
  const close = useCallback(() => setState({ mode: 'closed' }), [])

  const openedCardId = useRef<string | null>(null)
  useEffect(() => {
    if (initialCardId && openedCardId.current !== initialCardId) {
      openedCardId.current = initialCardId
      openCard(initialCardId)
    }
  }, [initialCardId, openCard])

  const value = useMemo(
    () => ({ state, openCreate, openCard, close }),
    [state, openCreate, openCard, close],
  )
  return <TaskSheetContext.Provider value={value}>{children}</TaskSheetContext.Provider>
}

export function useTaskSheet(): TaskSheetValue {
  const ctx = useContext(TaskSheetContext)
  if (!ctx) throw new Error('useTaskSheet must be used within a TaskSheetProvider')
  return ctx
}

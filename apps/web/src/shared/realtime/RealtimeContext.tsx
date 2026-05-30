import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import type { Socket } from 'socket.io-client'
import { createSocket } from './socket'
import { initialRealtimeState, realtimeReducer } from './realtimeSlice'
import {
  REALTIME_EVENTS,
  type Actor,
  type PresenceContext,
  type PresenceStatePayload,
  type PresenceUser,
  type TypingStatePayload,
} from './realtimeEvents'
import { useAuth } from '../../modules/auth/hooks/useAuth'
import { readString } from '../utils/localStorage'
import { TOKEN_STORAGE_KEY } from '../utils/constants'

const TYPING_TTL_MS = 3000

type Handler = (payload: unknown) => void

interface RealtimeContextValue {
  connected: boolean
  subscribe: (event: string, handler: Handler) => () => void
  joinBoard: (boardId: string) => void
  leaveBoard: (boardId: string) => void
  joinWorkspace: (workspaceId: string) => void
  leaveWorkspace: (workspaceId: string) => void
  setContext: (boardId: string, context: PresenceContext) => void
  emitTyping: (boardId: string, cardId: string) => void
  presenceForBoard: (boardId: string) => PresenceUser[]
  typingForCard: (cardId: string) => Actor[]
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined)
export { RealtimeContext }

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const [state, dispatch] = useReducer(realtimeReducer, initialRealtimeState)

  const socketRef = useRef<Socket | null>(null)
  const handlersRef = useRef(new Map<string, Set<Handler>>())
  const joinedBoards = useRef(new Set<string>())
  const joinedWorkspaces = useRef(new Set<string>())
  const typingTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const typingUsers = useRef(new Map<string, Map<string, Actor>>())

  const pushTyping = useCallback((cardId: string, user: Actor) => {
    const key = `${cardId}:${user.id}`
    const existing = typingTimers.current.get(key)
    if (existing) clearTimeout(existing)
    const forCard = typingUsers.current.get(cardId) ?? new Map<string, Actor>()
    forCard.set(user.id, user)
    typingUsers.current.set(cardId, forCard)
    dispatch({ type: 'TYPING_SET', cardId, users: [...forCard.values()] })
    typingTimers.current.set(
      key,
      setTimeout(() => {
        typingTimers.current.delete(key)
        const map = typingUsers.current.get(cardId)
        map?.delete(user.id)
        dispatch({ type: 'TYPING_SET', cardId, users: map ? [...map.values()] : [] })
      }, TYPING_TTL_MS),
    )
  }, [])

  useEffect(() => {
    if (status !== 'authenticated') return

    const socket = createSocket(() => readString(TOKEN_STORAGE_KEY))
    socketRef.current = socket

    socket.on('connect', () => {
      dispatch({ type: 'CONNECTED' })
      joinedBoards.current.forEach((id) => socket.emit(REALTIME_EVENTS.joinBoard, { boardId: id }))
      joinedWorkspaces.current.forEach((id) =>
        socket.emit(REALTIME_EVENTS.joinWorkspace, { workspaceId: id }),
      )
    })
    socket.on('disconnect', () => dispatch({ type: 'DISCONNECTED' }))
    socket.on('connect_error', () => dispatch({ type: 'DISCONNECTED' }))

    socket.on(REALTIME_EVENTS.presenceState, (payload: PresenceStatePayload) => {
      dispatch({ type: 'PRESENCE_SET', boardId: payload.boardId, users: payload.users })
    })
    socket.on(REALTIME_EVENTS.typingState, (payload: TypingStatePayload) => {
      pushTyping(payload.cardId, payload.user)
    })

    for (const [event, handlers] of handlersRef.current) {
      handlers.forEach((h) => socket.on(event, h))
    }

    socket.connect()

    const timers = typingTimers.current
    const users = typingUsers.current
    return () => {
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
      users.clear()
      dispatch({ type: 'RESET' })
    }
  }, [status, pushTyping])

  const subscribe = useCallback((event: string, handler: Handler) => {
    let set = handlersRef.current.get(event)
    if (!set) {
      set = new Set()
      handlersRef.current.set(event, set)
    }
    set.add(handler)
    socketRef.current?.on(event, handler)
    return () => {
      set?.delete(handler)
      socketRef.current?.off(event, handler)
    }
  }, [])

  const emit = useCallback((event: string, payload: unknown) => {
    socketRef.current?.emit(event, payload)
  }, [])

  const joinBoard = useCallback(
    (boardId: string) => {
      joinedBoards.current.add(boardId)
      emit(REALTIME_EVENTS.joinBoard, { boardId })
    },
    [emit],
  )
  const leaveBoard = useCallback(
    (boardId: string) => {
      joinedBoards.current.delete(boardId)
      emit(REALTIME_EVENTS.leaveBoard, { boardId })
    },
    [emit],
  )
  const joinWorkspace = useCallback(
    (workspaceId: string) => {
      joinedWorkspaces.current.add(workspaceId)
      emit(REALTIME_EVENTS.joinWorkspace, { workspaceId })
    },
    [emit],
  )
  const leaveWorkspace = useCallback(
    (workspaceId: string) => {
      joinedWorkspaces.current.delete(workspaceId)
      emit(REALTIME_EVENTS.leaveWorkspace, { workspaceId })
    },
    [emit],
  )

  const setContext = useCallback(
    (boardId: string, context: PresenceContext) =>
      emit(REALTIME_EVENTS.presenceContext, { boardId, context }),
    [emit],
  )
  const emitTyping = useCallback(
    (boardId: string, cardId: string) => emit(REALTIME_EVENTS.typing, { boardId, cardId }),
    [emit],
  )

  const value = useMemo<RealtimeContextValue>(
    () => ({
      connected: state.connected,
      subscribe,
      joinBoard,
      leaveBoard,
      joinWorkspace,
      leaveWorkspace,
      setContext,
      emitTyping,
      presenceForBoard: (boardId) => state.presenceByBoard[boardId] ?? [],
      typingForCard: (cardId) => state.typingByCard[cardId] ?? [],
    }),
    [
      state,
      subscribe,
      joinBoard,
      leaveBoard,
      joinWorkspace,
      leaveWorkspace,
      setContext,
      emitTyping,
    ],
  )

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

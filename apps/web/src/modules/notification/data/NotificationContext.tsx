import { createContext, useCallback, useEffect, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { initialNotificationState, notificationReducer, unreadCount } from './notificationSlice'
import type { NotificationState } from './notificationSlice'
import { notificationsApi } from './notificationApi'
import type { AppNotification } from './types'
import { useAuth } from '../../auth/hooks/useAuth'
import { useRealtime } from '../../../shared/realtime/useRealtime'
import { REALTIME_EVENTS } from '../../../shared/realtime/realtimeEvents'
import { notifyInfo } from '../../../shared/utils/notify'

interface NotificationContextValue extends NotificationState {
  unreadCount: number
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  clear: (id: string) => Promise<void>
  clearAll: () => Promise<void>
  refresh: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { status: authStatus } = useAuth()
  const { subscribe } = useRealtime()
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(notificationReducer, initialNotificationState)

  const load = useCallback(async (signal?: AbortSignal) => {
    dispatch({ type: 'LOADING' })
    try {
      const items = await notificationsApi.list(signal)
      dispatch({ type: 'LOADED', items })
    } catch (err) {
      if (signal?.aborted) return
      const message = err instanceof Error ? err.message : 'Could not load notifications'
      dispatch({ type: 'ERROR', error: message })
    }
  }, [])

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      if (authStatus === 'idle') dispatch({ type: 'RESET' })
      return
    }
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [authStatus, load])

  useEffect(() => {
    if (authStatus !== 'authenticated') return
    return subscribe(REALTIME_EVENTS.notification, (payload) => {
      const item = payload as AppNotification
      dispatch({ type: 'RECEIVED', item })
      const title = typeof item.data.title === 'string' ? item.data.title : 'New notification'
      const tab = item.type === 'WORKSPACE_INVITE' ? 'invites' : 'notifications'
      notifyInfo(title, item.data.message, () => navigate(`/inbox?tab=${tab}`))
    })
  }, [authStatus, subscribe, navigate])

  const markRead = useCallback(async (id: string) => {
    dispatch({ type: 'MARK_READ', id, readAt: new Date().toISOString() })
    try {
      await notificationsApi.markRead(id)
    } catch {
      // Optimistic; a failed read is silently tolerated and corrected on next load.
    }
  }, [])

  const markAllRead = useCallback(async () => {
    dispatch({ type: 'MARK_ALL_READ', readAt: new Date().toISOString() })
    await notificationsApi.markAllRead()
  }, [])

  const clear = useCallback(async (id: string) => {
    dispatch({ type: 'REMOVED', id })
    await notificationsApi.clear(id)
  }, [])

  const clearAll = useCallback(async () => {
    dispatch({ type: 'CLEARED' })
    await notificationsApi.clearAll()
  }, [])

  const refresh = useCallback(() => load(), [load])

  const value = useMemo<NotificationContextValue>(
    () => ({
      ...state,
      unreadCount: unreadCount(state.items),
      markRead,
      markAllRead,
      clear,
      clearAll,
      refresh,
    }),
    [state, markRead, markAllRead, clear, clearAll, refresh],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

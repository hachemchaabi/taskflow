import type { AppNotification } from './types'

export type NotificationStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface NotificationState {
  status: NotificationStatus
  items: AppNotification[]
  error: string | null
}

export const initialNotificationState: NotificationState = {
  status: 'idle',
  items: [],
  error: null,
}

export type NotificationAction =
  | { type: 'LOADING' }
  | { type: 'LOADED'; items: AppNotification[] }
  | { type: 'ERROR'; error: string }
  | { type: 'RECEIVED'; item: AppNotification }
  | { type: 'MARK_READ'; id: string; readAt: string }
  | { type: 'MARK_ALL_READ'; readAt: string }
  | { type: 'REMOVED'; id: string }
  | { type: 'CLEARED' }
  | { type: 'RESET' }

export function notificationReducer(
  state: NotificationState,
  action: NotificationAction,
): NotificationState {
  switch (action.type) {
    case 'LOADING':
      return { ...state, status: 'loading', error: null }
    case 'LOADED':
      return { status: 'ready', items: action.items, error: null }
    case 'ERROR':
      return { ...state, status: 'error', error: action.error }
    case 'RECEIVED': {
      if (state.items.some((n) => n.id === action.item.id)) return state
      return { ...state, items: [action.item, ...state.items] }
    }
    case 'MARK_READ':
      return {
        ...state,
        items: state.items.map((n) =>
          n.id === action.id && n.readAt === null ? { ...n, readAt: action.readAt } : n,
        ),
      }
    case 'MARK_ALL_READ':
      return {
        ...state,
        items: state.items.map((n) => (n.readAt === null ? { ...n, readAt: action.readAt } : n)),
      }
    case 'REMOVED':
      return { ...state, items: state.items.filter((n) => n.id !== action.id) }
    case 'CLEARED':
      return { ...state, items: [] }
    case 'RESET':
      return { ...initialNotificationState }
    default:
      return state
  }
}

export function unreadCount(items: AppNotification[]): number {
  return items.reduce((count, n) => (n.readAt === null ? count + 1 : count), 0)
}

import type { Actor, PresenceUser } from './realtimeEvents'

export interface RealtimeState {
  connected: boolean
  presenceByBoard: Record<string, PresenceUser[]>
  typingByCard: Record<string, Actor[]>
}

export const initialRealtimeState: RealtimeState = {
  connected: false,
  presenceByBoard: {},
  typingByCard: {},
}

export type RealtimeAction =
  | { type: 'CONNECTED' }
  | { type: 'DISCONNECTED' }
  | { type: 'PRESENCE_SET'; boardId: string; users: PresenceUser[] }
  | { type: 'TYPING_SET'; cardId: string; users: Actor[] }
  | { type: 'RESET' }

export function realtimeReducer(state: RealtimeState, action: RealtimeAction): RealtimeState {
  switch (action.type) {
    case 'CONNECTED':
      return { ...state, connected: true }
    case 'DISCONNECTED':
      return { ...initialRealtimeState }
    case 'PRESENCE_SET':
      return {
        ...state,
        presenceByBoard: { ...state.presenceByBoard, [action.boardId]: action.users },
      }
    case 'TYPING_SET': {
      const next = { ...state.typingByCard }
      if (action.users.length === 0) delete next[action.cardId]
      else next[action.cardId] = action.users
      return { ...state, typingByCard: next }
    }
    case 'RESET':
      return { ...initialRealtimeState }
    default:
      return state
  }
}

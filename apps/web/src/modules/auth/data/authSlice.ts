import type { User } from '../../../shared/types'

export interface AuthState {
  user: User | null
  token: string | null
  status: 'idle' | 'loading' | 'authenticated' | 'error'
  error: string | null
}

export type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'AUTH_RESOLVED' }
  | { type: 'USER_UPDATED'; payload: User }
  | { type: 'LOGOUT' }

export const loggedOutState: AuthState = {
  user: null,
  token: null,
  status: 'idle',
  error: null,
}

export const initialAuthState: AuthState = {
  user: null,
  token: null,
  status: 'loading',
  error: null,
}

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, status: 'loading', error: null }
    case 'LOGIN_SUCCESS':
      return {
        user: action.payload.user,
        token: action.payload.token,
        status: 'authenticated',
        error: null,
      }
    case 'LOGIN_ERROR':
      return { ...state, status: 'error', error: action.payload }
    case 'USER_UPDATED':
      if (!state.user) return state
      return { ...state, user: action.payload }
    case 'AUTH_RESOLVED':
      return { ...loggedOutState }
    case 'LOGOUT':
      return { ...loggedOutState }
    default:
      return state
  }
}

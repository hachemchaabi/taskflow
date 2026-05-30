import { createContext, useCallback, useEffect, useReducer } from 'react'
import type { ReactNode } from 'react'
import { authReducer, initialAuthState } from './authSlice'
import type { AuthState } from './authSlice'
import { authApi } from './authApi'
import { TOKEN_STORAGE_KEY } from '../../../shared/utils/constants'
import { writeString, remove } from '../../../shared/utils/localStorage'
import { notifyError } from '../../../shared/utils/notify'

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (name: string) => Promise<void>
  uploadAvatar: (file: File) => Promise<void>
  removeAvatar: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState)

  useEffect(() => {
    let cancelled = false
    authApi
      .refresh()
      .then(({ token, user }) => {
        if (cancelled) return
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'AUTH_RESOLVED' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' })
    try {
      const { token, user } = await authApi.login({ email, password })
      writeString(TOKEN_STORAGE_KEY, token)
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } })
    } catch (err) {
      const message = 'Invalid email or password.'
      notifyError(message)
      dispatch({ type: 'LOGIN_ERROR', payload: message })
      throw err
    }
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' })
    try {
      const { token, user } = await authApi.register({ name, email, password })
      writeString(TOKEN_STORAGE_KEY, token)
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } })
    } catch (err) {
      const message = registerErrorMessage(err)
      notifyError(message)
      dispatch({ type: 'LOGIN_ERROR', payload: message })
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      notifyError('Something went wrong while logging out.')
    }
    remove(TOKEN_STORAGE_KEY)
    dispatch({ type: 'LOGOUT' })
  }, [])

  const updateProfile = useCallback(async (name: string) => {
    const { user } = await authApi.updateProfile({ name })
    dispatch({ type: 'USER_UPDATED', payload: user })
  }, [])

  const uploadAvatar = useCallback(async (file: File) => {
    const { user } = await authApi.uploadAvatar(file)
    dispatch({ type: 'USER_UPDATED', payload: user })
  }, [])

  const removeAvatar = useCallback(async () => {
    const { user } = await authApi.removeAvatar()
    dispatch({ type: 'USER_UPDATED', payload: user })
  }, [])

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, updateProfile, uploadAvatar, removeAvatar }}
    >
      {children}
    </AuthContext.Provider>
  )
}

function registerErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    const status = (err as { response?: { status?: number } }).response?.status
    if (status === 409) return 'That email is already registered.'
  }
  return messageFor(err)
}

function messageFor(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    const maybe = err as { response?: { data?: { message?: string; error?: string } } }
    return (
      maybe.response?.data?.message ??
      maybe.response?.data?.error ??
      'Could not create your account. Please try again.'
    )
  }
  return 'Could not create your account. Please try again.'
}

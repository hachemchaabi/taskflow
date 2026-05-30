import { describe, expect, it } from 'vitest'
import { authReducer, initialAuthState, loggedOutState } from './authSlice'
import type { User } from '../../../shared/types'

const user: User = { id: '1', email: 'a@b.com', name: 'A' }

describe('authReducer', () => {
  it('starts in the loading status (boot refresh in flight)', () => {
    expect(initialAuthState.status).toBe('loading')
    expect(initialAuthState.token).toBeNull()
  })

  it('sets loading and clears error on LOGIN_START', () => {
    const errored = authReducer(initialAuthState, { type: 'LOGIN_ERROR', payload: 'x' })
    const next = authReducer(errored, { type: 'LOGIN_START' })
    expect(next.status).toBe('loading')
    expect(next.error).toBeNull()
  })

  it('stores the user and token on LOGIN_SUCCESS', () => {
    const next = authReducer(initialAuthState, {
      type: 'LOGIN_SUCCESS',
      payload: { user, token: 'tok-123' },
    })
    expect(next.status).toBe('authenticated')
    expect(next.user).toEqual(user)
    expect(next.token).toBe('tok-123')
    expect(next.error).toBeNull()
  })

  it('captures the message on LOGIN_ERROR', () => {
    const next = authReducer(initialAuthState, { type: 'LOGIN_ERROR', payload: 'bad creds' })
    expect(next.status).toBe('error')
    expect(next.error).toBe('bad creds')
  })

  it('drops the loading phase on AUTH_RESOLVED (no session found)', () => {
    const next = authReducer(initialAuthState, { type: 'AUTH_RESOLVED' })
    expect(next).toEqual(loggedOutState)
  })

  it('clears user and token on LOGOUT', () => {
    const authed = authReducer(initialAuthState, {
      type: 'LOGIN_SUCCESS',
      payload: { user, token: 'tok-123' },
    })
    expect(authReducer(authed, { type: 'LOGOUT' })).toEqual(loggedOutState)
  })

  it('patches the user in place on USER_UPDATED, keeping the session', () => {
    const authed = authReducer(initialAuthState, {
      type: 'LOGIN_SUCCESS',
      payload: { user, token: 'tok-123' },
    })
    const updated: User = { ...user, name: 'New Name', avatarUrl: 'https://img/a.png' }
    const next = authReducer(authed, { type: 'USER_UPDATED', payload: updated })
    expect(next.user).toEqual(updated)
    expect(next.status).toBe('authenticated')
    expect(next.token).toBe('tok-123')
  })

  it('ignores USER_UPDATED when logged out', () => {
    const next = authReducer(loggedOutState, { type: 'USER_UPDATED', payload: user })
    expect(next).toEqual(loggedOutState)
  })
})

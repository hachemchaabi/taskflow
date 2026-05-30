import { describe, it, expect } from 'vitest'
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from './auth.service.js'

describe('password hashing', () => {
  it('verifies a correct password against its hash', async () => {
    const hash = await hashPassword('password123')
    expect(hash).not.toBe('password123')
    expect(await verifyPassword('password123', hash)).toBe(true)
  })

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('password123')
    expect(await verifyPassword('wrong-password', hash)).toBe(false)
  })
})

describe('jwt tokens', () => {
  it('round-trips the user id through the access token', () => {
    const token = signAccessToken('user-abc')
    expect(verifyAccessToken(token)).toBe('user-abc')
  })

  it('round-trips the user id through the refresh token', () => {
    const token = signRefreshToken('user-abc')
    expect(verifyRefreshToken(token)).toBe('user-abc')
  })

  it('throws on a tampered/garbage token', () => {
    expect(() => verifyAccessToken('not.a.real.token')).toThrow()
    expect(() => verifyRefreshToken('not.a.real.token')).toThrow()
  })

  it('does not accept an access token as a refresh token (separate secrets)', () => {
    const access = signAccessToken('user-abc')
    expect(() => verifyRefreshToken(access)).toThrow()
  })
})

import { describe, it, expect, vi } from 'vitest'
import type { Request, Response } from 'express'
import { requireAuth } from './authMiddleware.js'
import { signAccessToken } from '../modules/auth/auth.service.js'
import { HttpError } from './errorHandler.js'

function makeReq(authorization?: string): Request {
  return { headers: authorization ? { authorization } : {} } as Request
}

describe('requireAuth', () => {
  it('sets req.userId and calls next for a valid token', () => {
    const token = signAccessToken('user-1')
    const req = makeReq(`Bearer ${token}`)
    const next = vi.fn()
    requireAuth(req, {} as Response, next)
    expect(req.userId).toBe('user-1')
    expect(next).toHaveBeenCalledOnce()
  })

  it('throws 401 when the Authorization header is missing', () => {
    expect(() => requireAuth(makeReq(), {} as Response, vi.fn())).toThrow(HttpError)
  })

  it('throws 401 when the header is malformed (no Bearer)', () => {
    expect(() => requireAuth(makeReq('Token abc'), {} as Response, vi.fn())).toThrow(HttpError)
  })

  it('throws 401 when the token is invalid', () => {
    expect(() => requireAuth(makeReq('Bearer garbage'), {} as Response, vi.fn())).toThrow(HttpError)
  })
})

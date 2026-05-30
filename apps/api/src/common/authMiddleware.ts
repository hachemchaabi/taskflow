import type { NextFunction, Request, Response } from 'express'
import { HttpError } from './errorHandler.js'
import { verifyAccessToken } from '../modules/auth/auth.service.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    throw new HttpError(401, 'Authentication required')
  }
  const token = header.slice('Bearer '.length).trim()
  try {
    req.userId = verifyAccessToken(token)
  } catch {
    throw new HttpError(401, 'Invalid or expired token')
  }
  next()
}

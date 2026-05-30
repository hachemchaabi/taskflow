import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env.js'

const SALT_ROUNDS = 10

export const DUMMY_PASSWORD_HASH = bcrypt.hashSync('invalid-placeholder-password', SALT_ROUNDS)

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

function subjectOf(decoded: string | jwt.JwtPayload): string {
  if (typeof decoded === 'string' || !decoded.sub) {
    throw new Error('Invalid token payload')
  }
  return decoded.sub
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.jwtSecret, {
    expiresIn: env.jwtAccessExpiresIn,
  } as jwt.SignOptions)
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  } as jwt.SignOptions)
}

export function verifyAccessToken(token: string): string {
  return subjectOf(jwt.verify(token, env.jwtSecret))
}

export function verifyRefreshToken(token: string): string {
  return subjectOf(jwt.verify(token, env.jwtRefreshSecret))
}

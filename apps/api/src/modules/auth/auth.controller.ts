import type { CookieOptions, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../prisma/prisma.service.js'
import { HttpError } from '../../common/errorHandler.js'
import { env } from '../../config/env.js'
import { generateUniqueSlug } from '../workspace/workspace.service.js'
import { imageStorage } from '../../common/imageStorage.service.js'
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  DUMMY_PASSWORD_HASH,
} from './auth.service.js'

const REFRESH_COOKIE = 'ctm.refresh'
const REFRESH_COOKIE_PATH = '/api/auth'
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: env.isProduction ? 'none' : 'strict',
  secure: env.isProduction,
  path: REFRESH_COOKIE_PATH,
  maxAge: REFRESH_MAX_AGE_MS,
}

function setRefreshCookie(res: Response, userId: string): void {
  res.cookie(REFRESH_COOKIE, signRefreshToken(userId), refreshCookieOptions)
}

const registerInput = z.object({
  email: z.string().email(),
  name: z.string().min(1, 'Name is required').max(120),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const loginInput = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const profileUpdateInput = z.object({
  name: z.string().min(1, 'Name is required').max(120),
})

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
const AVATAR_MIME = ['image/png', 'image/jpeg', 'image/svg+xml']
const AVATAR_DIR = '/user-avatars'

interface UserRecord {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  createdAt: Date
}

function toPublicUser(u: UserRecord) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt,
  }
}

export async function register(req: Request, res: Response): Promise<void> {
  const data = registerInput.parse(req.body)
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) throw new HttpError(409, 'Email already registered')

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { email: data.email, name: data.name, password: await hashPassword(data.password) },
    })
    const workspaceName = `${created.name}'s Workspace`
    await tx.workspace.create({
      data: {
        name: workspaceName,
        slug: await generateUniqueSlug(workspaceName, tx),
        ownerId: created.id,
        members: { create: { userId: created.id, role: 'OWNER' } },
      },
    })
    return created
  })
  setRefreshCookie(res, user.id)
  res.status(201).json({ token: signAccessToken(user.id), user: toPublicUser(user) })
}

export async function login(req: Request, res: Response): Promise<void> {
  const data = loginInput.parse(req.body)
  const user = await prisma.user.findUnique({ where: { email: data.email } })
  const passwordOk = await verifyPassword(data.password, user?.password ?? DUMMY_PASSWORD_HASH)
  if (!user || !passwordOk) {
    throw new HttpError(401, 'Invalid email or password')
  }
  setRefreshCookie(res, user.id)
  res.json({ token: signAccessToken(user.id), user: toPublicUser(user) })
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[REFRESH_COOKIE]
  if (!token) throw new HttpError(401, 'Refresh token required')

  let userId: string
  try {
    userId = verifyRefreshToken(token)
  } catch {
    throw new HttpError(401, 'Invalid or expired refresh token')
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new HttpError(401, 'Invalid or expired refresh token')

  setRefreshCookie(res, user.id)
  res.json({ token: signAccessToken(user.id), user: toPublicUser(user) })
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH })
  res.status(204).end()
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) throw new HttpError(404, 'User not found')
  res.json({ user: toPublicUser(user) })
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const data = profileUpdateInput.parse(req.body)
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { name: data.name },
  })
  res.json({ user: toPublicUser(user) })
}

export async function uploadAvatar(req: Request, res: Response): Promise<void> {
  const file = req.file
  if (!file) throw new HttpError(400, 'No avatar file provided')
  if (!AVATAR_MIME.includes(file.mimetype)) {
    throw new HttpError(415, 'Avatar must be a PNG, JPG or SVG image')
  }
  const avatarUrl = await imageStorage.upload(AVATAR_DIR, req.userId!, {
    buffer: file.buffer,
    mimetype: file.mimetype,
  })
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { avatarUrl },
  })
  res.json({ user: toPublicUser(user) })
}

export async function removeAvatar(req: Request, res: Response): Promise<void> {
  await imageStorage.remove(AVATAR_DIR, req.userId!)
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { avatarUrl: null },
  })
  res.json({ user: toPublicUser(user) })
}

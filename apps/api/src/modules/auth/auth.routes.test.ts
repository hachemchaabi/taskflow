import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'

vi.mock('../../prisma/prisma.service.js', () => {
  const userCreate = vi.fn()
  const workspaceCreate = vi.fn().mockResolvedValue({ id: 'w1' })
  const workspaceFindUnique = vi.fn().mockResolvedValue(null)
  const workspace = { create: workspaceCreate, findUnique: workspaceFindUnique }
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        create: userCreate,
        update: vi.fn(),
      },
      workspace,
      $transaction: (fn: (tx: unknown) => unknown) =>
        fn({ user: { create: userCreate }, workspace }),
    },
  }
})

vi.mock('../../common/imageStorage.service.js', () => ({
  imageStorage: {
    upload: vi.fn().mockResolvedValue('https://dl.dropboxusercontent.com/s/x/avatar.png?raw=1'),
    remove: vi.fn().mockResolvedValue(undefined),
  },
}))

import { app } from '../../app.module.js'
import { prisma } from '../../prisma/prisma.service.js'
import { imageStorage } from '../../common/imageStorage.service.js'
import { hashPassword, signAccessToken, signRefreshToken } from './auth.service.js'

const userFindUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>
const userCreate = prisma.user.create as unknown as ReturnType<typeof vi.fn>
const userUpdate = prisma.user.update as unknown as ReturnType<typeof vi.fn>
const imageUpload = imageStorage.upload as unknown as ReturnType<typeof vi.fn>
const imageRemove = imageStorage.remove as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token (no password in body)', async () => {
    userFindUnique.mockResolvedValue(null)
    userCreate.mockResolvedValue({
      id: 'u1',
      email: 'new@example.com',
      name: 'New',
      avatarUrl: null,
      createdAt: new Date('2026-01-01'),
    })

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', name: 'New', password: 'password123' })

    expect(res.status).toBe(201)
    expect(res.body.token).toBeTypeOf('string')
    expect(res.body.user.email).toBe('new@example.com')
    expect(res.body.user.password).toBeUndefined()
  })

  it('returns 409 when the email is already registered', async () => {
    userFindUnique.mockResolvedValue({ id: 'u1', email: 'dup@example.com' })
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', name: 'Dup', password: 'password123' })
    expect(res.status).toBe(409)
  })

  it('returns 400 on invalid body (short password)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'x@example.com', name: 'X', password: 'short' })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  it('returns a token for valid credentials', async () => {
    userFindUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@example.com',
      name: 'A',
      avatarUrl: null,
      createdAt: new Date('2026-01-01'),
      password: await hashPassword('password123'),
    })
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@example.com', password: 'password123' })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeTypeOf('string')
    expect(res.body.user.password).toBeUndefined()
  })

  it('returns 401 for an unknown email', async () => {
    userFindUnique.mockResolvedValue(null)
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' })
    expect(res.status).toBe(401)
  })

  it('returns 401 for a wrong password', async () => {
    userFindUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@example.com',
      name: 'A',
      avatarUrl: null,
      createdAt: new Date('2026-01-01'),
      password: await hashPassword('password123'),
    })
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@example.com', password: 'wrong-password' })
    expect(res.status).toBe(401)
  })

  it('returns an identical 401 body for unknown email and wrong password', async () => {
    userFindUnique.mockResolvedValueOnce(null)
    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' })

    userFindUnique.mockResolvedValueOnce({
      id: 'u1',
      email: 'a@example.com',
      name: 'A',
      avatarUrl: null,
      createdAt: new Date('2026-01-01'),
      password: await hashPassword('password123'),
    })
    const wrong = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@example.com', password: 'wrong-password' })

    expect(unknown.status).toBe(401)
    expect(wrong.status).toBe(401)
    expect(unknown.body).toEqual(wrong.body)
  })
})

describe('GET /api/auth/me', () => {
  it('returns the current user for a valid token', async () => {
    userFindUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@example.com',
      name: 'A',
      avatarUrl: null,
      createdAt: new Date('2026-01-01'),
    })
    const token = signAccessToken('u1')
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.user.id).toBe('u1')
  })

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('returns 404 when the token is valid but the user no longer exists', async () => {
    userFindUnique.mockResolvedValue(null)
    const token = signAccessToken('ghost')
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/auth/me', () => {
  it('updates the name and returns the user', async () => {
    userUpdate.mockResolvedValue({
      id: 'u1',
      email: 'a@example.com',
      name: 'New Name',
      avatarUrl: null,
      createdAt: new Date('2026-01-01'),
    })
    const token = signAccessToken('u1')
    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name' })

    expect(res.status).toBe(200)
    expect(res.body.user.name).toBe('New Name')
    expect(res.body.user.password).toBeUndefined()
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' }, data: { name: 'New Name' } }),
    )
  })

  it('returns 400 for an empty name', async () => {
    const token = signAccessToken('u1')
    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' })
    expect(res.status).toBe(400)
    expect(userUpdate).not.toHaveBeenCalled()
  })

  it('returns 401 without a token', async () => {
    const res = await request(app).patch('/api/auth/me').send({ name: 'X' })
    expect(res.status).toBe(401)
  })
})

describe('PUT /api/auth/me/avatar', () => {
  it('stores the avatar and returns the updated user', async () => {
    userUpdate.mockResolvedValue({
      id: 'u1',
      email: 'a@example.com',
      name: 'A',
      avatarUrl: 'https://dl.dropboxusercontent.com/s/x/avatar.png?raw=1',
      createdAt: new Date('2026-01-01'),
    })
    const token = signAccessToken('u1')
    const res = await request(app)
      .put('/api/auth/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', Buffer.from('fake-png'), { filename: 'me.png', contentType: 'image/png' })

    expect(res.status).toBe(200)
    expect(res.body.user.avatarUrl).toContain('raw=1')
    expect(imageUpload).toHaveBeenCalledWith('/user-avatars', 'u1', expect.anything())
  })

  it('returns 415 for an unsupported file type', async () => {
    const token = signAccessToken('u1')
    const res = await request(app)
      .put('/api/auth/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', Buffer.from('nope'), { filename: 'me.gif', contentType: 'image/gif' })

    expect(res.status).toBe(415)
    expect(imageUpload).not.toHaveBeenCalled()
  })

  it('returns 400 when no file is provided', async () => {
    const token = signAccessToken('u1')
    const res = await request(app)
      .put('/api/auth/me/avatar')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/auth/me/avatar', () => {
  it('clears the avatar and returns the user', async () => {
    userUpdate.mockResolvedValue({
      id: 'u1',
      email: 'a@example.com',
      name: 'A',
      avatarUrl: null,
      createdAt: new Date('2026-01-01'),
    })
    const token = signAccessToken('u1')
    const res = await request(app)
      .delete('/api/auth/me/avatar')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.user.avatarUrl).toBeNull()
    expect(imageRemove).toHaveBeenCalledWith('/user-avatars', 'u1')
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' }, data: { avatarUrl: null } }),
    )
  })
})

describe('register/login set a refresh cookie', () => {
  it('sets an httpOnly ctm.refresh cookie on register', async () => {
    userFindUnique.mockResolvedValue(null)
    userCreate.mockResolvedValue({
      id: 'u1',
      email: 'new@example.com',
      name: 'New',
      avatarUrl: null,
      createdAt: new Date('2026-01-01'),
    })
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', name: 'New', password: 'password123' })

    const cookies = res.headers['set-cookie'] as unknown as string[]
    expect(cookies.some((c) => c.startsWith('ctm.refresh=') && /HttpOnly/i.test(c))).toBe(true)
  })
})

describe('POST /api/auth/refresh', () => {
  it('issues a new access token from a valid refresh cookie', async () => {
    userFindUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@example.com',
      name: 'A',
      avatarUrl: null,
      createdAt: new Date('2026-01-01'),
    })
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`ctm.refresh=${signRefreshToken('u1')}`])

    expect(res.status).toBe(200)
    expect(res.body.token).toBeTypeOf('string')
    expect(res.body.user.id).toBe('u1')
    const cookies = res.headers['set-cookie'] as unknown as string[]
    expect(cookies.some((c) => c.startsWith('ctm.refresh='))).toBe(true)
  })

  it('returns 401 when no refresh cookie is present', async () => {
    const res = await request(app).post('/api/auth/refresh')
    expect(res.status).toBe(401)
  })

  it('returns 401 for a garbage refresh cookie', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', ['ctm.refresh=not-a-real-token'])
    expect(res.status).toBe(401)
  })

  it('returns 401 when the refresh token is valid but the user is gone', async () => {
    userFindUnique.mockResolvedValue(null)
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`ctm.refresh=${signRefreshToken('ghost')}`])
    expect(res.status).toBe(401)
  })
})

describe('POST /api/auth/logout', () => {
  it('clears the refresh cookie and returns 204', async () => {
    const res = await request(app).post('/api/auth/logout')
    expect(res.status).toBe(204)
    const cookies = res.headers['set-cookie'] as unknown as string[]
    expect(cookies.some((c) => c.startsWith('ctm.refresh=;'))).toBe(true)
  })
})

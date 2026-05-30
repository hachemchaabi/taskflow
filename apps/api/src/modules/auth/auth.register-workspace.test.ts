import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

const { createTx, txClient } = vi.hoisted(() => {
  const createTx = vi.fn()
  return {
    createTx,
    txClient: {
      user: {
        create: vi.fn().mockResolvedValue({
          id: 'u1',
          email: 'new@example.com',
          name: 'New User',
          avatarUrl: null,
          createdAt: new Date(),
        }),
      },
      workspace: { create: createTx, findUnique: vi.fn().mockResolvedValue(null) },
    },
  }
})

vi.mock('../../prisma/prisma.service.js', () => ({
  prisma: {
    user: { findUnique: vi.fn().mockResolvedValue(null) },
    $transaction: (fn: (tx: unknown) => unknown) => fn(txClient),
  },
}))

import { app } from '../../app.module.js'

describe('POST /api/auth/register', () => {
  beforeEach(() => createTx.mockClear())

  it('creates a personal workspace for the new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', name: 'New User', password: 'password123' })

    expect(res.status).toBe(201)
    expect(createTx).toHaveBeenCalledTimes(1)
    const arg = createTx.mock.calls[0][0] as {
      data: { ownerId: string; members: { create: unknown } }
    }
    expect(arg.data.ownerId).toBe('u1')
    expect(arg.data.members.create).toEqual({ userId: 'u1', role: 'OWNER' })
  })
})

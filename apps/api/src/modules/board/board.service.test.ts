import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../prisma/prisma.service.js', () => ({
  prisma: {
    boardMember: { findUnique: vi.fn(), count: vi.fn() },
  },
}))

import { assertBoardRole, assertNotLastBoardOwner } from './board.service.js'
import { prisma } from '../../prisma/prisma.service.js'

describe('assertBoardRole', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 403 when the user is not a board member', async () => {
    vi.mocked(prisma.boardMember.findUnique).mockResolvedValue(null as never)
    await expect(assertBoardRole('u1', 'b1', ['OWNER'])).rejects.toMatchObject({ status: 403 })
  })

  it('throws 403 when the role is not allowed', async () => {
    vi.mocked(prisma.boardMember.findUnique).mockResolvedValue({ role: 'MEMBER' } as never)
    await expect(assertBoardRole('u1', 'b1', ['OWNER', 'ADMIN'])).rejects.toMatchObject({
      status: 403,
    })
  })

  it('returns the role when allowed', async () => {
    vi.mocked(prisma.boardMember.findUnique).mockResolvedValue({ role: 'ADMIN' } as never)
    await expect(assertBoardRole('u1', 'b1', ['OWNER', 'ADMIN'])).resolves.toBe('ADMIN')
  })
})

describe('assertNotLastBoardOwner', () => {
  beforeEach(() => vi.clearAllMocks())

  it('blocks removing the last owner with 400', async () => {
    vi.mocked(prisma.boardMember.findUnique).mockResolvedValue({ role: 'OWNER' } as never)
    vi.mocked(prisma.boardMember.count).mockResolvedValue(1 as never)
    await expect(assertNotLastBoardOwner('b1', 'u1')).rejects.toMatchObject({ status: 400 })
  })

  it('allows removing a non-owner', async () => {
    vi.mocked(prisma.boardMember.findUnique).mockResolvedValue({ role: 'MEMBER' } as never)
    await expect(assertNotLastBoardOwner('b1', 'u1')).resolves.toBeUndefined()
  })

  it('allows removing an owner when others remain', async () => {
    vi.mocked(prisma.boardMember.findUnique).mockResolvedValue({ role: 'OWNER' } as never)
    vi.mocked(prisma.boardMember.count).mockResolvedValue(2 as never)
    await expect(assertNotLastBoardOwner('b1', 'u1')).resolves.toBeUndefined()
  })
})

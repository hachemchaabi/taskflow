import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

vi.mock('../../prisma/prisma.service.js', () => ({
  prisma: {
    board: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    boardMember: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workspaceMember: { findUnique: vi.fn() },
  },
}))
vi.mock('../workspace/workspace.service.js', () => ({
  assertWorkspaceRole: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('./board.service.js', () => ({
  assertBoardRole: vi.fn().mockResolvedValue('OWNER'),
  assertNotLastBoardOwner: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('./iconStorage.service.js', () => ({
  iconStorage: {
    upload: vi.fn().mockResolvedValue('https://dl.dropboxusercontent.com/s/x/icon.png?raw=1'),
    remove: vi.fn().mockResolvedValue(undefined),
  },
}))

import { app } from '../../app.module.js'
import {
  addBoardMember,
  createBoard,
  getBoard,
  listBoards,
  updateBoard,
  updateBoardMemberRole,
  removeBoardMember,
} from './board.controller.js'
import { prisma } from '../../prisma/prisma.service.js'
import { assertWorkspaceRole } from '../workspace/workspace.service.js'
import { assertBoardRole, assertNotLastBoardOwner } from './board.service.js'
import { signAccessToken } from '../auth/auth.service.js'
import { HttpError } from '../../common/errorHandler.js'

const auth = `Bearer ${signAccessToken('u1')}`

function mockRes() {
  const json = vi.fn()
  const end = vi.fn()
  return { res: { status: vi.fn().mockReturnValue({ json, end }), json, end } as never, json, end }
}

describe('board routes auth', () => {
  it('rejects unauthenticated GET /api/boards with 401', async () => {
    const res = await request(app).get('/api/boards')
    expect(res.status).toBe(401)
  })
})

describe('listBoards', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns only boards the caller is a member of', async () => {
    vi.mocked(prisma.board.findMany).mockResolvedValue([] as never)
    const req = { userId: 'u1', query: { workspaceId: 'w1' } } as never
    const { res } = mockRes()

    await listBoards(req, res)

    const args = vi.mocked(prisma.board.findMany).mock.calls[0][0] as { where: unknown }
    expect(args.where).toMatchObject({
      workspaceId: 'w1',
      members: { some: { userId: 'u1' } },
    })
  })
})

describe('getBoard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('selects and returns each member’s avatarUrl in the board detail', async () => {
    vi.mocked(prisma.board.findUnique).mockResolvedValue({
      id: 'b1',
      title: 'B',
      labels: [],
      lists: [],
      members: [
        {
          id: 'bm1',
          userId: 'u1',
          role: 'OWNER',
          user: { id: 'u1', name: 'Hachem', email: 'h@x.io', avatarUrl: 'https://img/h.jpg' },
        },
      ],
    } as never)
    const { res, json } = mockRes()

    await getBoard({ userId: 'u1', params: { id: 'b1' } } as never, res)

    const body = json.mock.calls[0][0] as { members: { user: { avatarUrl: string } }[] }
    expect(body.members[0].user.avatarUrl).toBe('https://img/h.jpg')
    const arg = vi.mocked(prisma.board.findUnique).mock.calls[0][0] as {
      include: { members: { include: { user: { select: Record<string, boolean> } } } }
    }
    expect(arg.include.members.include.user.select).toHaveProperty('avatarUrl', true)
  })
})

describe('createBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.board.findFirst).mockResolvedValue(null as never)
  })

  it('seeds default columns so a new board renders a usable kanban', async () => {
    vi.mocked(prisma.board.create).mockResolvedValue({ id: 'b1' } as never)
    const req = { userId: 'u1', body: { title: 'My List', workspaceId: 'w1' } } as never
    const { res } = mockRes()

    await createBoard(req, res)

    const data = vi.mocked(prisma.board.create).mock.calls[0][0].data as {
      lists?: { create: { title: string; position: number }[] }
    }
    expect(data.lists?.create).toHaveLength(3)
    expect(data.lists?.create.map((l) => l.title)).toEqual(['To Do', 'In Progress', 'Done'])
    expect(data.lists?.create.map((l) => l.position)).toEqual([0, 1, 2])
  })

  it('rejects a duplicate name in the same workspace (case-insensitive)', async () => {
    vi.mocked(prisma.board.findFirst).mockResolvedValue({ id: 'existing' } as never)
    const req = { userId: 'u1', body: { title: 'website sprint', workspaceId: 'w1' } } as never
    const { res } = mockRes()

    await expect(createBoard(req, res)).rejects.toMatchObject({ status: 409 })
    expect(prisma.board.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workspaceId: 'w1',
          title: { equals: 'website sprint', mode: 'insensitive' },
        }),
      }),
    )
    expect(prisma.board.create).not.toHaveBeenCalled()
  })
})

describe('updateBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.board.findUnique).mockResolvedValue({ id: 'b1', workspaceId: 'w1' } as never)
    vi.mocked(assertWorkspaceRole).mockResolvedValue(undefined as never)
  })

  it('rejects a caller without a role in the board workspace', async () => {
    vi.mocked(assertWorkspaceRole).mockRejectedValue(new Error('forbidden'))
    const req = { userId: 'u1', params: { id: 'b1' }, body: { title: 'Fresh' } } as never
    const { res } = mockRes()

    await expect(updateBoard(req, res)).rejects.toThrow()
    expect(prisma.board.update).not.toHaveBeenCalled()
  })

  it('rejects renaming onto an existing board name, excluding itself', async () => {
    vi.mocked(prisma.board.findFirst).mockResolvedValue({ id: 'other' } as never)
    const req = { userId: 'u1', params: { id: 'b1' }, body: { title: 'Done' } } as never
    const { res } = mockRes()

    await expect(updateBoard(req, res)).rejects.toMatchObject({ status: 409 })
    expect(prisma.board.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workspaceId: 'w1', id: { not: 'b1' } }),
      }),
    )
    expect(prisma.board.update).not.toHaveBeenCalled()
  })

  it('allows a rename when no other board shares the name', async () => {
    vi.mocked(prisma.board.findFirst).mockResolvedValue(null as never)
    vi.mocked(prisma.board.update).mockResolvedValue({ id: 'b1', title: 'Fresh' } as never)
    const req = { userId: 'u1', params: { id: 'b1' }, body: { title: 'Fresh' } } as never
    const { res, json } = mockRes()

    await updateBoard(req, res)

    expect(prisma.board.update).toHaveBeenCalled()
    expect(json).toHaveBeenCalledWith({ id: 'b1', title: 'Fresh' })
  })
})

describe('addBoardMember', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.board.findUnique).mockResolvedValue({ workspaceId: 'w1' } as never)
  })

  it('rejects a user who is not in the board workspace with 400', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null as never)
    const req = { userId: 'u1', params: { id: 'b1' }, body: { userId: 'u2' } } as never
    const { res } = mockRes()
    await expect(addBoardMember(req, res)).rejects.toMatchObject({ status: 400 })
    expect(prisma.boardMember.create).not.toHaveBeenCalled()
  })

  it('rejects a duplicate board member with 409', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({ userId: 'u2' } as never)
    vi.mocked(prisma.boardMember.findUnique).mockResolvedValue({ id: 'bm1' } as never)
    const req = { userId: 'u1', params: { id: 'b1' }, body: { userId: 'u2' } } as never
    const { res } = mockRes()
    await expect(addBoardMember(req, res)).rejects.toMatchObject({ status: 409 })
    expect(prisma.boardMember.create).not.toHaveBeenCalled()
  })

  it('adds a workspace member as a board MEMBER by default', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({ userId: 'u2' } as never)
    vi.mocked(prisma.boardMember.findUnique).mockResolvedValue(null as never)
    vi.mocked(prisma.boardMember.create).mockResolvedValue({
      id: 'bm2',
      userId: 'u2',
      role: 'MEMBER',
      user: { id: 'u2', name: 'Sam', email: 's@x.io', avatarUrl: null },
    } as never)
    const req = { userId: 'u1', params: { id: 'b1' }, body: { userId: 'u2' } } as never
    const { res, json } = mockRes()
    await addBoardMember(req, res)
    expect(vi.mocked(prisma.boardMember.create).mock.calls[0][0].data).toMatchObject({
      boardId: 'b1',
      userId: 'u2',
      role: 'MEMBER',
    })
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u2', role: 'MEMBER' }))
  })
})

describe('updateBoardMemberRole', () => {
  beforeEach(() => vi.clearAllMocks())

  it('blocks demoting the last owner', async () => {
    vi.mocked(assertNotLastBoardOwner).mockRejectedValueOnce(
      Object.assign(new Error('last owner'), { status: 400 }),
    )
    const req = {
      userId: 'u1',
      params: { id: 'b1', userId: 'u1' },
      body: { role: 'MEMBER' },
    } as never
    const { res } = mockRes()
    await expect(updateBoardMemberRole(req, res)).rejects.toMatchObject({ status: 400 })
    expect(prisma.boardMember.update).not.toHaveBeenCalled()
  })

  it('updates a member role and returns the mapped member', async () => {
    vi.mocked(prisma.boardMember.update).mockResolvedValue({
      id: 'bm2',
      userId: 'u2',
      role: 'ADMIN',
      user: { id: 'u2', name: 'Sam', email: 's@x.io', avatarUrl: null },
    } as never)
    const req = {
      userId: 'u1',
      params: { id: 'b1', userId: 'u2' },
      body: { role: 'ADMIN' },
    } as never
    const { res, json } = mockRes()
    await updateBoardMemberRole(req, res)
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u2', role: 'ADMIN' }))
  })
})

describe('removeBoardMember', () => {
  beforeEach(() => vi.clearAllMocks())

  it('removes another member after the last-owner guard passes', async () => {
    vi.mocked(prisma.boardMember.delete).mockResolvedValue({} as never)
    const req = { userId: 'u1', params: { id: 'b1', userId: 'u2' } } as never
    const { res } = mockRes()
    await removeBoardMember(req, res)
    expect(prisma.boardMember.delete).toHaveBeenCalledWith({
      where: { boardId_userId: { boardId: 'b1', userId: 'u2' } },
    })
  })

  it('blocks the last owner from leaving', async () => {
    vi.mocked(assertNotLastBoardOwner).mockRejectedValueOnce(
      Object.assign(new Error('last owner'), { status: 400 }),
    )
    const req = { userId: 'u1', params: { id: 'b1', userId: 'u1' } } as never
    const { res } = mockRes()
    await expect(removeBoardMember(req, res)).rejects.toMatchObject({ status: 400 })
    expect(prisma.boardMember.delete).not.toHaveBeenCalled()
  })
})

describe('list icon upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(assertBoardRole).mockResolvedValue('OWNER' as never)
  })

  it('uploads an icon and returns the stored URL', async () => {
    vi.mocked(prisma.board.update).mockImplementation((({
      data,
    }: {
      data: { iconUrl: string | null }
    }) =>
      Promise.resolve({
        id: 'b1',
        title: 'Sprint',
        iconUrl: data.iconUrl,
        workspaceId: 'w1',
      })) as never)
    const res = await request(app)
      .put('/api/boards/b1/icon')
      .set('Authorization', auth)
      .attach('icon', Buffer.from('fake-png-bytes'), {
        filename: 'icon.png',
        contentType: 'image/png',
      })
    expect(res.status).toBe(200)
    expect(res.body.iconUrl).toBe('https://dl.dropboxusercontent.com/s/x/icon.png?raw=1')
  })

  it('rejects a non-image icon with 415', async () => {
    const res = await request(app)
      .put('/api/boards/b1/icon')
      .set('Authorization', auth)
      .attach('icon', Buffer.from('not-an-image'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      })
    expect(res.status).toBe(415)
    expect(prisma.board.update).not.toHaveBeenCalled()
  })

  it('rejects a caller without a manage role', async () => {
    vi.mocked(assertBoardRole).mockRejectedValueOnce(new HttpError(403, 'forbidden'))
    const res = await request(app)
      .put('/api/boards/b1/icon')
      .set('Authorization', auth)
      .attach('icon', Buffer.from('fake-png-bytes'), {
        filename: 'icon.png',
        contentType: 'image/png',
      })
    expect(res.status).toBe(403)
  })

  it('clears the icon on remove', async () => {
    vi.mocked(prisma.board.update).mockResolvedValue({
      id: 'b1',
      title: 'Sprint',
      iconUrl: null,
      workspaceId: 'w1',
    } as never)
    const res = await request(app).delete('/api/boards/b1/icon').set('Authorization', auth)
    expect(res.status).toBe(200)
    expect(res.body.iconUrl).toBeNull()
    expect(vi.mocked(prisma.board.update).mock.calls[0][0].data).toMatchObject({ iconUrl: null })
  })
})

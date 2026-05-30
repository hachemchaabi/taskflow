import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../prisma/prisma.service.js', () => ({
  prisma: {
    list: { findUnique: vi.fn() },
    card: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    boardMember: { count: vi.fn() },
    label: { count: vi.fn(), create: vi.fn() },
    comment: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    activity: { create: vi.fn(), findMany: vi.fn() },
    board: { findUnique: vi.fn() },
    notificationPreference: { findUnique: vi.fn() },
    notificationMute: { findFirst: vi.fn() },
    workspaceMember: { findUnique: vi.fn() },
    notification: { create: vi.fn() },
  },
}))
vi.mock('../workspace/workspace.service.js', () => ({
  assertWorkspaceRole: vi.fn().mockResolvedValue('OWNER'),
}))

import {
  createCard,
  getCard,
  updateCard,
  deleteCard,
  addComment,
  editComment,
  deleteComment,
  createLabel,
} from './card.controller.js'
import { prisma } from '../../prisma/prisma.service.js'
import { assertWorkspaceRole } from '../workspace/workspace.service.js'
import { HttpError } from '../../common/errorHandler.js'

const commentRow = (over: Record<string, unknown> = {}) => ({
  authorId: 'u1',
  cardId: 'c1',
  deletedAt: null,
  card: { list: { boardId: 'b1', board: { workspaceId: 'w1' } } },
  ...over,
})

const mockRes = () => {
  const json = vi.fn()
  const status = vi.fn().mockReturnValue({ json })
  return { res: { status, json } as never, json, status }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(assertWorkspaceRole).mockResolvedValue('OWNER')
  vi.mocked(prisma.list.findUnique).mockResolvedValue({
    boardId: 'b1',
    board: { workspaceId: 'w1' },
  } as never)
  vi.mocked(prisma.card.findFirst).mockResolvedValue({ position: 2 } as never)
  vi.mocked(prisma.activity.create).mockResolvedValue({} as never)
  vi.mocked(prisma.activity.findMany).mockResolvedValue([] as never)
})

describe('createCard', () => {
  it('creates a card at the next position and logs a "created" activity', async () => {
    vi.mocked(prisma.card.create).mockResolvedValue({ id: 'c1', title: 'UX Copywriter' } as never)
    const req = {
      userId: 'u1',
      params: { boardId: 'b1' },
      body: { title: 'UX Copywriter', listId: 'l1' },
    } as never
    const { res, json, status } = mockRes()

    await createCard(req, res)

    const createArg = vi.mocked(prisma.card.create).mock.calls[0][0].data as {
      position: number
      title: string
    }
    expect(createArg.position).toBe(3)
    expect(createArg.title).toBe('UX Copywriter')
    expect(status).toHaveBeenCalledWith(201)
    expect(
      (vi.mocked(prisma.activity.create).mock.calls[0][0].data as { action: string }).action,
    ).toContain('created')
    expect(json).toHaveBeenCalled()
  })

  it('rejects assignees who are not board members', async () => {
    vi.mocked(prisma.boardMember.count).mockResolvedValue(0 as never)
    const req = {
      userId: 'u1',
      params: { boardId: 'b1' },
      body: { title: 'Nope', listId: 'l1', assigneeIds: ['x'] },
    } as never
    const { res } = mockRes()
    await expect(createCard(req, res)).rejects.toMatchObject({ status: 400 })
  })

  it('rejects when the list belongs to another board', async () => {
    const req = {
      userId: 'u1',
      params: { boardId: 'other' },
      body: { title: 'X', listId: 'l1' },
    } as never
    const { res } = mockRes()
    await expect(createCard(req, res)).rejects.toMatchObject({ status: 400 })
  })
})

describe('updateCard', () => {
  beforeEach(() => {
    vi.mocked(prisma.card.findUnique).mockResolvedValue({
      title: 'Old',
      description: null,
      priority: 'NONE',
      assignees: [],
      labels: [],
      list: { id: 'l1', title: 'To Do', boardId: 'b1', board: { workspaceId: 'w1' } },
    } as never)
  })

  it('patches the title and logs a rename activity', async () => {
    vi.mocked(prisma.card.update).mockResolvedValue({ id: 'c1', title: 'New' } as never)
    const req = { userId: 'u1', params: { id: 'c1' }, body: { title: 'New' } } as never
    const { res, json } = mockRes()

    await updateCard(req, res)

    expect((vi.mocked(prisma.card.update).mock.calls[0][0].data as { title: string }).title).toBe(
      'New',
    )
    const actions = vi
      .mocked(prisma.activity.create)
      .mock.calls.map((c) => (c[0].data as { action: string }).action)
    expect(actions.some((a) => a.includes('renamed'))).toBe(true)
    expect(json).toHaveBeenCalled()
  })

  it('logs nothing when nothing changes', async () => {
    vi.mocked(prisma.card.update).mockResolvedValue({ id: 'c1', title: 'Old' } as never)
    const req = { userId: 'u1', params: { id: 'c1' }, body: { title: 'Old' } } as never
    const { res } = mockRes()

    await updateCard(req, res)

    expect(vi.mocked(prisma.activity.create)).not.toHaveBeenCalled()
  })

  it('clears assignees via set:[] and logs an assignees activity', async () => {
    vi.mocked(prisma.card.update).mockResolvedValue({ id: 'c1' } as never)
    const req = { userId: 'u1', params: { id: 'c1' }, body: { assigneeIds: [] } } as never
    const { res } = mockRes()

    await updateCard(req, res)

    const updateData = vi.mocked(prisma.card.update).mock.calls[0][0].data as {
      assignees: { set: unknown[] }
    }
    expect(updateData.assignees).toEqual({ set: [] })
    const actions = vi
      .mocked(prisma.activity.create)
      .mock.calls.map((c) => (c[0].data as { action: string }).action)
    expect(actions.some((a) => a.includes('assignees'))).toBe(true)
  })

  it('patches the priority and logs a priority activity', async () => {
    vi.mocked(prisma.card.update).mockResolvedValue({ id: 'c1', priority: 'HIGH' } as never)
    const req = { userId: 'u1', params: { id: 'c1' }, body: { priority: 'HIGH' } } as never
    const { res } = mockRes()

    await updateCard(req, res)

    expect(
      (vi.mocked(prisma.card.update).mock.calls[0][0].data as { priority: string }).priority,
    ).toBe('HIGH')
    const actions = vi
      .mocked(prisma.activity.create)
      .mock.calls.map((c) => (c[0].data as { action: string }).action)
    expect(actions.some((a) => a.includes('priority'))).toBe(true)
  })

  it('logs a timeline activity when endDate changes', async () => {
    vi.mocked(prisma.card.update).mockResolvedValue({ id: 'c1' } as never)
    const req = {
      userId: 'u1',
      params: { id: 'c1' },
      body: { endDate: '2026-07-01T00:00:00.000Z' },
    } as never
    const { res } = mockRes()

    await updateCard(req, res)

    const actions = vi
      .mocked(prisma.activity.create)
      .mock.calls.map((c) => (c[0].data as { action: string }).action)
    expect(actions.some((a) => a.includes('timeline'))).toBe(true)
  })
})

describe('getCard', () => {
  it('returns 404 when the card detail is not found after access check', async () => {
    vi.mocked(prisma.card.findUnique)
      .mockResolvedValueOnce({
        listId: 'l1',
        list: { boardId: 'b1', board: { workspaceId: 'w1' } },
      } as never)
      .mockResolvedValueOnce(null as never)
    const req = { userId: 'u1', params: { id: 'c-missing' } } as never
    const { res } = mockRes()

    await expect(getCard(req, res)).rejects.toMatchObject({ status: 404 })
  })
})

describe('deleteCard', () => {
  it('deletes the card after asserting access and responds 204', async () => {
    vi.mocked(prisma.card.findUnique).mockResolvedValue({
      listId: 'l1',
      list: { boardId: 'b1', board: { workspaceId: 'w1' } },
    } as never)
    vi.mocked(prisma.card.delete).mockResolvedValue({ id: 'c1' } as never)
    const req = { userId: 'u1', params: { id: 'c1' } } as never
    const status = vi.fn().mockReturnValue({ send: vi.fn() })
    const res = { status } as never

    await deleteCard(req, res)

    expect(prisma.card.delete).toHaveBeenCalledWith({ where: { id: 'c1' } })
    expect(status).toHaveBeenCalledWith(204)
  })
})

describe('addComment', () => {
  it('creates a comment authored by the requester', async () => {
    vi.mocked(prisma.card.findUnique).mockResolvedValue({
      listId: 'l1',
      list: { boardId: 'b1', board: { workspaceId: 'w1' } },
    } as never)
    vi.mocked(prisma.comment.create).mockResolvedValue({
      id: 'cm1',
      body: 'Hello',
      author: { id: 'u1', name: 'Me', avatarUrl: null },
    } as never)
    const req = { userId: 'u1', params: { id: 'c1' }, body: { body: 'Hello' } } as never
    const { res, status } = mockRes()

    await addComment(req, res)

    expect(vi.mocked(prisma.comment.create).mock.calls[0][0].data).toMatchObject({
      body: 'Hello',
      cardId: 'c1',
      authorId: 'u1',
      parentId: null,
    })
    expect(status).toHaveBeenCalledWith(201)
  })

  it('persists parentId when replying to a top-level comment', async () => {
    vi.mocked(prisma.card.findUnique).mockResolvedValue({
      listId: 'l1',
      list: { boardId: 'b1', board: { workspaceId: 'w1' } },
    } as never)
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({
      cardId: 'c1',
      parentId: null,
    } as never)
    vi.mocked(prisma.comment.create).mockResolvedValue({ id: 'r1' } as never)
    const req = {
      userId: 'u1',
      params: { id: 'c1' },
      body: { body: 'a reply', parentId: 'cmRoot' },
    } as never
    const { res } = mockRes()

    await addComment(req, res)

    expect(vi.mocked(prisma.comment.create).mock.calls[0][0].data).toMatchObject({
      parentId: 'cmRoot',
    })
  })

  it('flattens a reply-to-a-reply onto the root parent (one level deep)', async () => {
    vi.mocked(prisma.card.findUnique).mockResolvedValue({
      listId: 'l1',
      list: { boardId: 'b1', board: { workspaceId: 'w1' } },
    } as never)
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({
      cardId: 'c1',
      parentId: 'cmRoot',
    } as never)
    vi.mocked(prisma.comment.create).mockResolvedValue({ id: 'r2' } as never)
    const req = {
      userId: 'u1',
      params: { id: 'c1' },
      body: { body: 'nested', parentId: 'cmReply' },
    } as never
    const { res } = mockRes()

    await addComment(req, res)

    expect(vi.mocked(prisma.comment.create).mock.calls[0][0].data).toMatchObject({
      parentId: 'cmRoot',
    })
  })

  it('rejects a parent comment that belongs to a different card', async () => {
    vi.mocked(prisma.card.findUnique).mockResolvedValue({
      listId: 'l1',
      list: { boardId: 'b1', board: { workspaceId: 'w1' } },
    } as never)
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({
      cardId: 'other-card',
      parentId: null,
    } as never)
    const req = {
      userId: 'u1',
      params: { id: 'c1' },
      body: { body: 'reply', parentId: 'cmElsewhere' },
    } as never
    const { res } = mockRes()

    await expect(addComment(req, res)).rejects.toMatchObject({ status: 404 })
    expect(prisma.comment.create).not.toHaveBeenCalled()
  })

  it('persists @[id] mentions for valid board members', async () => {
    vi.mocked(prisma.card.findUnique).mockResolvedValue({
      listId: 'l1',
      list: { boardId: 'b1', board: { workspaceId: 'w1' } },
    } as never)
    vi.mocked(prisma.boardMember.count).mockResolvedValue(1 as never)
    vi.mocked(prisma.comment.create).mockResolvedValue({ id: 'cm1' } as never)
    const req = { userId: 'u1', params: { id: 'c1' }, body: { body: 'ping @[u2]' } } as never
    const { res, status } = mockRes()

    await addComment(req, res)

    expect(vi.mocked(prisma.comment.create).mock.calls[0][0].data).toMatchObject({
      mentions: { create: [{ userId: 'u2' }] },
    })
    expect(status).toHaveBeenCalledWith(201)
  })

  it('rejects a mention of someone who is not a board member', async () => {
    vi.mocked(prisma.card.findUnique).mockResolvedValue({
      listId: 'l1',
      list: { boardId: 'b1', board: { workspaceId: 'w1' } },
    } as never)
    vi.mocked(prisma.boardMember.count).mockResolvedValue(0 as never)
    const req = { userId: 'u1', params: { id: 'c1' }, body: { body: 'hi @[outsider]' } } as never
    const { res } = mockRes()

    await expect(addComment(req, res)).rejects.toMatchObject({ status: 400 })
    expect(prisma.comment.create).not.toHaveBeenCalled()
  })
})

describe('editComment', () => {
  it('lets the author edit, setting the body and editedAt', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue(commentRow() as never)
    vi.mocked(prisma.comment.update).mockResolvedValue({ id: 'cm1' } as never)
    const req = {
      userId: 'u1',
      params: { id: 'c1', commentId: 'cm1' },
      body: { body: 'fixed typo' },
    } as never
    const { res, status } = mockRes()

    await editComment(req, res)

    const data = vi.mocked(prisma.comment.update).mock.calls[0][0].data as {
      body: string
      editedAt: Date
    }
    expect(data.body).toBe('fixed typo')
    expect(data.editedAt).toBeInstanceOf(Date)
    expect(status).not.toHaveBeenCalledWith(403)
  })

  it('forbids a non-author from editing', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue(commentRow({ authorId: 'u2' }) as never)
    const req = { userId: 'u1', params: { commentId: 'cm1' }, body: { body: 'nope' } } as never
    const { res } = mockRes()
    await expect(editComment(req, res)).rejects.toMatchObject({ status: 403 })
    expect(prisma.comment.update).not.toHaveBeenCalled()
  })

  it('refuses to edit a deleted comment', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue(
      commentRow({ deletedAt: new Date() }) as never,
    )
    const req = { userId: 'u1', params: { commentId: 'cm1' }, body: { body: 'x' } } as never
    const { res } = mockRes()
    await expect(editComment(req, res)).rejects.toMatchObject({ status: 400 })
  })
})

describe('deleteComment', () => {
  it('soft-deletes: clears the body and mentions and stamps deletedAt', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue(commentRow() as never)
    vi.mocked(prisma.comment.update).mockResolvedValue({ id: 'cm1' } as never)
    const req = { userId: 'u1', params: { id: 'c1', commentId: 'cm1' } } as never
    const { res } = mockRes()

    await deleteComment(req, res)

    const data = vi.mocked(prisma.comment.update).mock.calls[0][0].data as {
      body: string
      deletedAt: Date
      mentions: { deleteMany: unknown }
    }
    expect(data.body).toBe('')
    expect(data.deletedAt).toBeInstanceOf(Date)
    expect(data.mentions).toEqual({ deleteMany: {} })
  })

  it('lets a workspace OWNER/ADMIN delete someone else’s comment', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue(commentRow({ authorId: 'u2' }) as never)
    vi.mocked(prisma.comment.update).mockResolvedValue({ id: 'cm1' } as never)
    const req = { userId: 'u1', params: { commentId: 'cm1' } } as never
    const { res } = mockRes()
    await deleteComment(req, res)
    expect(prisma.comment.update).toHaveBeenCalled()
  })

  it('forbids a plain MEMBER from deleting someone else’s comment', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue(commentRow({ authorId: 'u2' }) as never)
    vi.mocked(assertWorkspaceRole).mockImplementation(async (_u, _w, allowed) => {
      if (!allowed.includes('MEMBER')) throw new HttpError(403, 'no permission')
      return 'MEMBER'
    })
    const req = { userId: 'u1', params: { commentId: 'cm1' } } as never
    const { res } = mockRes()
    await expect(deleteComment(req, res)).rejects.toMatchObject({ status: 403 })
    expect(prisma.comment.update).not.toHaveBeenCalled()
  })
})

describe('createLabel', () => {
  it('creates a label on the board', async () => {
    vi.mocked(prisma.board.findUnique).mockResolvedValue({ workspaceId: 'w1' } as never)
    vi.mocked(prisma.label.create).mockResolvedValue({
      id: 'lb1',
      name: 'Bug',
      color: '#ef4444',
    } as never)
    const req = {
      userId: 'u1',
      params: { boardId: 'b1' },
      body: { name: 'Bug', color: '#ef4444' },
    } as never
    const { res, status } = mockRes()

    await createLabel(req, res)

    expect(vi.mocked(prisma.label.create).mock.calls[0][0].data).toMatchObject({
      name: 'Bug',
      color: '#ef4444',
      boardId: 'b1',
    })
    expect(status).toHaveBeenCalledWith(201)
  })
})

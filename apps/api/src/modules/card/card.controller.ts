import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../prisma/prisma.service.js'
import { HttpError } from '../../common/errorHandler.js'
import { assertWorkspaceRole } from '../workspace/workspace.service.js'
import {
  assertBoardAccess,
  assertBoardLabels,
  assertBoardMembers,
  assertCardAccess,
  assertCommentAccess,
  assertListAccess,
  boardWorkspaceId,
  logActivity,
  nextCardPosition,
  parseMentionIds,
} from './card.service.js'
import { emitBoardChanged, emitCardChanged } from '../../realtime/realtime.emitter.js'
import { loadActor } from '../../realtime/realtime.actor.js'
import {
  notifyCardAssigned,
  notifyCardMoved,
  notifyCommentOnAssigned,
  notifyMention,
  notifyStatusChanged,
} from '../notification/notification.triggers.js'

const mentionUser = { select: { id: true, name: true, avatarUrl: true } } as const

const commentInclude = {
  author: { select: { id: true, name: true, avatarUrl: true } },
  mentions: { include: { user: mentionUser } },
} as const

const cardDetailInclude = {
  assignees: { select: { id: true, name: true, avatarUrl: true } },
  labels: true,
  comments: {
    orderBy: { createdAt: 'asc' as const },
    include: commentInclude,
  },
} as const

const priority = z.enum(['HIGH', 'MEDIUM', 'LOW', 'NONE'])

const createInput = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  listId: z.string().min(1),
  description: z.string().max(5000).optional(),
  priority: priority.optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  assigneeIds: z.array(z.string()).optional(),
  labelIds: z.array(z.string()).optional(),
})

const updateInput = z.object({
  title: z.string().min(1).max(200).optional(),
  listId: z.string().min(1).optional(),
  description: z.string().max(5000).nullable().optional(),
  priority: priority.optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  assigneeIds: z.array(z.string()).optional(),
  labelIds: z.array(z.string()).optional(),
})

const commentInput = z.object({
  body: z.string().min(1).max(2000),
  parentId: z.string().optional(),
})
const labelInput = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

async function getActivities(cardId: string) {
  return prisma.activity.findMany({
    where: { cardId },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true } } },
  })
}

export async function createCard(req: Request, res: Response): Promise<void> {
  const userId = req.userId!
  const data = createInput.parse(req.body)
  const boardId = await assertListAccess(userId, data.listId)
  if (boardId !== req.params.boardId) throw new HttpError(400, 'List does not belong to this board')
  await assertBoardMembers(boardId, data.assigneeIds ?? [])
  await assertBoardLabels(boardId, data.labelIds ?? [])

  const card = await prisma.card.create({
    data: {
      title: data.title,
      description: data.description,
      listId: data.listId,
      priority: data.priority,
      createdById: userId,
      position: await nextCardPosition(data.listId),
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      assignees: { connect: (data.assigneeIds ?? []).map((id) => ({ id })) },
      labels: { connect: (data.labelIds ?? []).map((id) => ({ id })) },
    },
    include: cardDetailInclude,
  })

  await logActivity(boardId, card.id, userId, `created "${card.title}"`)
  const actor = await loadActor(userId)
  emitBoardChanged(boardId, 'card.created', actor, card.id)

  const assigned = (data.assigneeIds ?? []).filter((id) => id !== userId)
  if (assigned.length) {
    const workspaceId = await boardWorkspaceId(boardId)
    await notifyCardAssigned(userId, actor.name, assigned, {
      id: card.id,
      title: card.title,
      workspaceId,
      boardId,
    })
  }

  res.status(201).json({ ...card, activities: await getActivities(card.id) })
}

export async function getCard(req: Request, res: Response): Promise<void> {
  await assertCardAccess(req.userId!, req.params.id)
  const card = await prisma.card.findUnique({
    where: { id: req.params.id },
    include: cardDetailInclude,
  })
  if (!card) throw new HttpError(404, 'Card not found')
  res.json({ ...card, activities: await getActivities(card.id) })
}

export async function updateCard(req: Request, res: Response): Promise<void> {
  const userId = req.userId!
  const data = updateInput.parse(req.body)
  const existing = await prisma.card.findUnique({
    where: { id: req.params.id },
    include: {
      list: {
        select: { id: true, title: true, boardId: true, board: { select: { workspaceId: true } } },
      },
      assignees: { select: { id: true } },
      labels: { select: { id: true } },
    },
  })
  if (!existing) throw new HttpError(404, 'Card not found')
  await assertWorkspaceRole(userId, existing.list.board.workspaceId, ['OWNER', 'ADMIN', 'MEMBER'])
  const boardId = existing.list.boardId

  if (data.assigneeIds) await assertBoardMembers(boardId, data.assigneeIds)
  if (data.labelIds) await assertBoardLabels(boardId, data.labelIds)
  if (data.listId) {
    const moveBoardId = await assertListAccess(userId, data.listId)
    if (moveBoardId !== boardId) throw new HttpError(400, 'Cannot move a card to another board')
  }

  const card = await prisma.card.update({
    where: { id: req.params.id },
    data: {
      title: data.title,
      description: data.description,
      listId: data.listId,
      priority: data.priority,
      ...(data.startDate !== undefined
        ? { startDate: data.startDate ? new Date(data.startDate) : null }
        : {}),
      ...(data.endDate !== undefined
        ? { endDate: data.endDate ? new Date(data.endDate) : null }
        : {}),
      ...(data.assigneeIds ? { assignees: { set: data.assigneeIds.map((id) => ({ id })) } } : {}),
      ...(data.labelIds ? { labels: { set: data.labelIds.map((id) => ({ id })) } } : {}),
    },
    include: cardDetailInclude,
  })

  if (data.title && data.title !== existing.title)
    await logActivity(boardId, card.id, userId, `renamed the task to "${data.title}"`)
  if (data.description !== undefined && data.description !== existing.description)
    await logActivity(boardId, card.id, userId, 'updated the description')
  if (data.priority !== undefined && data.priority !== existing.priority)
    await logActivity(boardId, card.id, userId, 'changed the priority')
  if (data.startDate !== undefined || data.endDate !== undefined)
    await logActivity(boardId, card.id, userId, 'updated the timeline')
  if (data.assigneeIds) await logActivity(boardId, card.id, userId, 'updated the assignees')
  if (data.labelIds) await logActivity(boardId, card.id, userId, 'updated the labels')
  if (data.listId && data.listId !== existing.list.id)
    await logActivity(boardId, card.id, userId, 'moved the task to another list')

  const moved = Boolean(data.listId && data.listId !== existing.list.id)
  const actor = await loadActor(userId)
  emitCardChanged(card.id, boardId, actor)
  emitBoardChanged(boardId, moved ? 'card.moved' : 'card.updated', actor, card.id)

  const cardCtx = {
    id: card.id,
    title: card.title,
    workspaceId: existing.list.board.workspaceId,
    boardId,
  }

  if (data.assigneeIds) {
    const before = new Set(existing.assignees.map((a) => a.id))
    const added = data.assigneeIds.filter((id) => !before.has(id) && id !== userId)
    if (added.length) await notifyCardAssigned(userId, actor.name, added, cardCtx)
  }

  if (moved) {
    const toList = await prisma.list.findUnique({
      where: { id: data.listId! },
      select: { title: true },
    })
    const toTitle = toList?.title ?? 'another list'
    const assigneeIds = card.assignees.map((a) => a.id).filter((id) => id !== userId)
    if (assigneeIds.length) await notifyCardMoved(userId, actor.name, assigneeIds, cardCtx, toTitle)
    if (existing.createdById && existing.createdById !== userId)
      await notifyStatusChanged(userId, actor.name, [existing.createdById], cardCtx, toTitle)
  }

  res.json({ ...card, activities: await getActivities(card.id) })
}

export async function deleteCard(req: Request, res: Response): Promise<void> {
  const userId = req.userId!
  const { boardId } = await assertCardAccess(userId, req.params.id)
  await prisma.card.delete({ where: { id: req.params.id } })
  emitBoardChanged(boardId, 'card.deleted', await loadActor(userId), req.params.id)
  res.status(204).send()
}

export async function addComment(req: Request, res: Response): Promise<void> {
  const userId = req.userId!
  const { body, parentId } = commentInput.parse(req.body)
  const { boardId } = await assertCardAccess(userId, req.params.id)

  let rootParentId: string | null = null
  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { cardId: true, parentId: true },
    })
    if (!parent || parent.cardId !== req.params.id)
      throw new HttpError(404, 'Parent comment not found on this card')
    rootParentId = parent.parentId ?? parentId
  }

  const mentionIds = parseMentionIds(body)
  await assertBoardMembers(boardId, mentionIds, 'mentioned users')
  const comment = await prisma.comment.create({
    data: {
      body,
      cardId: req.params.id,
      authorId: userId,
      parentId: rootParentId,
      mentions: { create: mentionIds.map((id) => ({ userId: id })) },
    },
    include: commentInclude,
  })
  const actor = await loadActor(userId)
  emitCardChanged(req.params.id, boardId, actor)
  emitBoardChanged(boardId, 'comment.created', actor, req.params.id)

  const ctx = await prisma.card.findUnique({
    where: { id: req.params.id },
    select: {
      title: true,
      assignees: { select: { id: true } },
      list: { select: { board: { select: { workspaceId: true } } } },
    },
  })
  if (ctx) {
    const cardCtx = {
      id: req.params.id,
      title: ctx.title,
      workspaceId: ctx.list.board.workspaceId,
      boardId,
    }
    const mentioned = new Set(mentionIds)
    if (mentionIds.length) await notifyMention(userId, actor.name, mentionIds, cardCtx)

    const commentRecipients = (ctx.assignees ?? [])
      .map((a) => a.id)
      .filter((id) => id !== userId && !mentioned.has(id))
    if (commentRecipients.length)
      await notifyCommentOnAssigned(userId, actor.name, commentRecipients, cardCtx)
  }

  res.status(201).json(comment)
}

export async function editComment(req: Request, res: Response): Promise<void> {
  const userId = req.userId!
  const { body } = commentInput.parse(req.body)
  const { authorId, boardId, cardId, deletedAt } = await assertCommentAccess(
    userId,
    req.params.commentId,
  )
  if (deletedAt) throw new HttpError(400, 'A deleted comment cannot be edited')
  if (authorId !== userId) throw new HttpError(403, 'Only the author can edit this comment')

  const mentionIds = parseMentionIds(body)
  await assertBoardMembers(boardId, mentionIds, 'mentioned users')
  const comment = await prisma.comment.update({
    where: { id: req.params.commentId },
    data: {
      body,
      editedAt: new Date(),
      mentions: { deleteMany: {}, create: mentionIds.map((id) => ({ userId: id })) },
    },
    include: commentInclude,
  })

  const actor = await loadActor(userId)
  emitCardChanged(cardId, boardId, actor)
  emitBoardChanged(boardId, 'comment.updated', actor, cardId)
  res.json(comment)
}

export async function deleteComment(req: Request, res: Response): Promise<void> {
  const userId = req.userId!
  const { authorId, boardId, cardId, workspaceId } = await assertCommentAccess(
    userId,
    req.params.commentId,
  )
  if (authorId !== userId) await assertWorkspaceRole(userId, workspaceId, ['OWNER', 'ADMIN'])

  const comment = await prisma.comment.update({
    where: { id: req.params.commentId },
    data: { deletedAt: new Date(), body: '', mentions: { deleteMany: {} } },
    include: commentInclude,
  })

  const actor = await loadActor(userId)
  emitCardChanged(cardId, boardId, actor)
  emitBoardChanged(boardId, 'comment.deleted', actor, cardId)
  res.json(comment)
}

export async function createLabel(req: Request, res: Response): Promise<void> {
  const userId = req.userId!
  const data = labelInput.parse(req.body)
  await assertBoardAccess(userId, req.params.boardId)
  const label = await prisma.label.create({
    data: { name: data.name, color: data.color, boardId: req.params.boardId },
  })
  res.status(201).json(label)
}

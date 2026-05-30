import { prisma } from '../../prisma/prisma.service.js'
import { HttpError } from '../../common/errorHandler.js'
import { assertWorkspaceRole } from '../workspace/workspace.service.js'

const WRITE_ROLES = ['OWNER', 'ADMIN', 'MEMBER'] as const

export async function assertListAccess(userId: string, listId: string): Promise<string> {
  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: { boardId: true, board: { select: { workspaceId: true } } },
  })
  if (!list) throw new HttpError(404, 'List not found')
  await assertWorkspaceRole(userId, list.board.workspaceId, [...WRITE_ROLES])
  return list.boardId
}

export async function assertCardAccess(
  userId: string,
  cardId: string,
): Promise<{ boardId: string; listId: string }> {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: {
      listId: true,
      list: { select: { boardId: true, board: { select: { workspaceId: true } } } },
    },
  })
  if (!card) throw new HttpError(404, 'Card not found')
  await assertWorkspaceRole(userId, card.list.board.workspaceId, [...WRITE_ROLES])
  return { boardId: card.list.boardId, listId: card.listId }
}

export async function assertCommentAccess(
  userId: string,
  commentId: string,
): Promise<{
  authorId: string
  cardId: string
  boardId: string
  workspaceId: string
  deletedAt: Date | null
}> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      authorId: true,
      cardId: true,
      deletedAt: true,
      card: {
        select: { list: { select: { boardId: true, board: { select: { workspaceId: true } } } } },
      },
    },
  })
  if (!comment) throw new HttpError(404, 'Comment not found')
  const { workspaceId } = comment.card.list.board
  await assertWorkspaceRole(userId, workspaceId, [...WRITE_ROLES])
  return {
    authorId: comment.authorId,
    cardId: comment.cardId,
    boardId: comment.card.list.boardId,
    workspaceId,
    deletedAt: comment.deletedAt,
  }
}

export async function assertBoardAccess(userId: string, boardId: string): Promise<void> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { workspaceId: true },
  })
  if (!board) throw new HttpError(404, 'Board not found')
  await assertWorkspaceRole(userId, board.workspaceId, [...WRITE_ROLES])
}

export async function assertBoardMembers(
  boardId: string,
  userIds: string[],
  noun = 'assignees',
): Promise<void> {
  if (userIds.length === 0) return
  const count = await prisma.boardMember.count({ where: { boardId, userId: { in: userIds } } })
  if (count !== new Set(userIds).size)
    throw new HttpError(400, `One or more ${noun} are not board members`)
}

export function parseMentionIds(body: string): string[] {
  const ids = new Set<string>()
  for (const match of body.matchAll(/@\[([a-z0-9]+)\]/g)) ids.add(match[1])
  return [...ids]
}

export async function assertBoardLabels(boardId: string, labelIds: string[]): Promise<void> {
  if (labelIds.length === 0) return
  const count = await prisma.label.count({ where: { boardId, id: { in: labelIds } } })
  if (count !== new Set(labelIds).size)
    throw new HttpError(400, 'One or more labels do not belong to this board')
}

export async function boardWorkspaceId(boardId: string): Promise<string> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { workspaceId: true },
  })
  if (!board) throw new HttpError(404, 'Board not found')
  return board.workspaceId
}

export async function nextCardPosition(listId: string): Promise<number> {
  const last = await prisma.card.findFirst({
    where: { listId },
    orderBy: { position: 'desc' },
    select: { position: true },
  })
  return (last?.position ?? -1) + 1
}

export async function logActivity(
  boardId: string,
  cardId: string,
  userId: string,
  action: string,
): Promise<void> {
  await prisma.activity.create({ data: { boardId, cardId, userId, action } })
}

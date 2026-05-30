import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../prisma/prisma.service.js'
import { HttpError } from '../../common/errorHandler.js'
import { assertWorkspaceRole } from '../workspace/workspace.service.js'
import { assertBoardRole, assertNotLastBoardOwner } from './board.service.js'
import { iconStorage } from './iconStorage.service.js'
import { emitBoardsChanged } from '../../realtime/realtime.emitter.js'
import { loadActor } from '../../realtime/realtime.actor.js'

export const ICON_MAX_BYTES = 2 * 1024 * 1024
const ICON_MIME = ['image/png', 'image/jpeg', 'image/svg+xml']

const boardInput = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120),
  workspaceId: z.string().min(1, 'Workspace is required'),
})

const DEFAULT_LISTS = ['To Do', 'In Progress', 'Done']

const DUPLICATE_TITLE = 'A board with this name already exists in this workspace.'

const boardMemberSelect = { id: true, name: true, email: true, avatarUrl: true } as const

function toBoardMember(m: {
  id: string
  userId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  user: { id: string; name: string; email: string; avatarUrl: string | null }
}) {
  return { id: m.id, userId: m.userId, role: m.role, user: m.user }
}

async function assertUniqueBoardTitle(
  workspaceId: string,
  title: string,
  excludeId?: string,
): Promise<void> {
  const existing = await prisma.board.findFirst({
    where: {
      workspaceId,
      title: { equals: title, mode: 'insensitive' },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  })
  if (existing) throw new HttpError(409, DUPLICATE_TITLE)
}

export async function listBoards(req: Request, res: Response): Promise<void> {
  const workspaceId = z.string().min(1).parse(req.query.workspaceId)
  await assertWorkspaceRole(req.userId!, workspaceId, ['OWNER', 'ADMIN', 'MEMBER'])
  const boards = await prisma.board.findMany({
    where: { workspaceId, members: { some: { userId: req.userId } } },
    orderBy: { createdAt: 'desc' },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { members: true, lists: true } },
      members: { where: { userId: req.userId }, select: { role: true } },
    },
  })
  res.json(
    boards.map(({ members, ...board }) => ({ ...board, role: members[0]?.role ?? 'MEMBER' })),
  )
}

export async function getBoard(req: Request, res: Response): Promise<void> {
  const role = await assertBoardRole(req.userId!, req.params.id, ['OWNER', 'ADMIN', 'MEMBER'])
  const board = await prisma.board.findUnique({
    where: { id: req.params.id },
    include: {
      labels: true,
      members: { include: { user: { select: boardMemberSelect } } },
      lists: {
        orderBy: { position: 'asc' },
        include: {
          cards: {
            orderBy: { position: 'asc' },
            include: {
              labels: true,
              assignees: { select: { id: true, name: true, avatarUrl: true } },
              _count: { select: { comments: true } },
            },
          },
        },
      },
    },
  })
  if (!board) throw new HttpError(404, 'Board not found')
  res.json({ ...board, role })
}

export async function createBoard(req: Request, res: Response): Promise<void> {
  const data = boardInput.parse(req.body)
  if (!req.userId) throw new HttpError(401, 'Authentication required')
  await assertWorkspaceRole(req.userId, data.workspaceId, ['OWNER', 'ADMIN', 'MEMBER'])
  await assertUniqueBoardTitle(data.workspaceId, data.title)
  const board = await prisma.board.create({
    data: {
      title: data.title,
      ownerId: req.userId,
      workspaceId: data.workspaceId,
      members: { create: { userId: req.userId, role: 'OWNER' } },
      lists: {
        create: DEFAULT_LISTS.map((title, position) => ({ title, position })),
      },
    },
  })
  emitBoardsChanged(data.workspaceId, await loadActor(req.userId))
  res.status(201).json(board)
}

export async function updateBoard(req: Request, res: Response): Promise<void> {
  await assertBoardRole(req.userId!, req.params.id, ['OWNER', 'ADMIN'])
  const data = boardInput.partial().parse(req.body)
  const current = await prisma.board.findUnique({
    where: { id: req.params.id },
    select: { id: true, workspaceId: true },
  })
  if (!current) throw new HttpError(404, 'Board not found')
  if (data.title) await assertUniqueBoardTitle(current.workspaceId, data.title, current.id)
  const board = await prisma.board.update({
    where: { id: current.id },
    data: { title: data.title },
  })
  emitBoardsChanged(current.workspaceId, await loadActor(req.userId!))
  res.json(board)
}

export async function uploadIcon(req: Request, res: Response): Promise<void> {
  await assertBoardRole(req.userId!, req.params.id, ['OWNER', 'ADMIN'])
  const file = req.file
  if (!file) throw new HttpError(400, 'No icon file provided')
  if (!ICON_MIME.includes(file.mimetype)) {
    throw new HttpError(415, 'Icon must be a PNG, JPG or SVG image')
  }
  const iconUrl = await iconStorage.upload(req.params.id, {
    buffer: file.buffer,
    mimetype: file.mimetype,
  })
  const board = await prisma.board.update({
    where: { id: req.params.id },
    data: { iconUrl },
  })
  emitBoardsChanged(board.workspaceId, await loadActor(req.userId!))
  res.json(board)
}

export async function removeIcon(req: Request, res: Response): Promise<void> {
  await assertBoardRole(req.userId!, req.params.id, ['OWNER', 'ADMIN'])
  await iconStorage.remove(req.params.id)
  const board = await prisma.board.update({
    where: { id: req.params.id },
    data: { iconUrl: null },
  })
  emitBoardsChanged(board.workspaceId, await loadActor(req.userId!))
  res.json(board)
}

export async function deleteBoard(req: Request, res: Response): Promise<void> {
  await assertBoardRole(req.userId!, req.params.id, ['OWNER', 'ADMIN'])
  const board = await prisma.board.findUnique({
    where: { id: req.params.id },
    select: { workspaceId: true },
  })
  await prisma.board.delete({ where: { id: req.params.id } })
  if (board) emitBoardsChanged(board.workspaceId, await loadActor(req.userId!))
  res.status(204).end()
}

const addMemberInput = z.object({
  userId: z.string().min(1),
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
})
const roleInput = z.object({ role: z.enum(['OWNER', 'ADMIN', 'MEMBER']) })

export async function listBoardMembers(req: Request, res: Response): Promise<void> {
  await assertBoardRole(req.userId!, req.params.id, ['OWNER', 'ADMIN', 'MEMBER'])
  const members = await prisma.boardMember.findMany({
    where: { boardId: req.params.id },
    include: { user: { select: boardMemberSelect } },
  })
  res.json(members.map(toBoardMember))
}

export async function addBoardMember(req: Request, res: Response): Promise<void> {
  await assertBoardRole(req.userId!, req.params.id, ['OWNER', 'ADMIN'])
  const data = addMemberInput.parse(req.body)
  const board = await prisma.board.findUnique({
    where: { id: req.params.id },
    select: { workspaceId: true },
  })
  if (!board) throw new HttpError(404, 'Board not found')
  const inWorkspace = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: board.workspaceId, userId: data.userId } },
  })
  if (!inWorkspace) throw new HttpError(400, 'That person is not a member of this workspace')
  const already = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId: req.params.id, userId: data.userId } },
  })
  if (already) throw new HttpError(409, 'That person is already a member of this board')
  const member = await prisma.boardMember.create({
    data: { boardId: req.params.id, userId: data.userId, role: data.role ?? 'MEMBER' },
    include: { user: { select: boardMemberSelect } },
  })
  emitBoardsChanged(board.workspaceId, await loadActor(req.userId!))
  res.status(201).json(toBoardMember(member))
}

export async function updateBoardMemberRole(req: Request, res: Response): Promise<void> {
  await assertBoardRole(req.userId!, req.params.id, ['OWNER'])
  const { role } = roleInput.parse(req.body)
  if (role !== 'OWNER') await assertNotLastBoardOwner(req.params.id, req.params.userId)
  const member = await prisma.boardMember.update({
    where: { boardId_userId: { boardId: req.params.id, userId: req.params.userId } },
    data: { role },
    include: { user: { select: boardMemberSelect } },
  })
  res.json(toBoardMember(member))
}

export async function removeBoardMember(req: Request, res: Response): Promise<void> {
  const isSelf = req.userId === req.params.userId
  if (!isSelf) await assertBoardRole(req.userId!, req.params.id, ['OWNER', 'ADMIN'])
  else await assertBoardRole(req.userId!, req.params.id, ['OWNER', 'ADMIN', 'MEMBER'])
  await assertNotLastBoardOwner(req.params.id, req.params.userId)
  const board = await prisma.board.findUnique({
    where: { id: req.params.id },
    select: { workspaceId: true },
  })
  await prisma.boardMember.delete({
    where: { boardId_userId: { boardId: req.params.id, userId: req.params.userId } },
  })
  if (board) emitBoardsChanged(board.workspaceId, await loadActor(req.userId!))
  res.status(204).end()
}

import type { Request, Response } from 'express'
import type { MemberRole, Visibility } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../../prisma/prisma.service.js'
import { HttpError } from '../../common/errorHandler.js'
import {
  assertWorkspaceRole,
  assertNotLastOwner,
  generateUniqueSlug,
  slugify,
} from './workspace.service.js'
import { logoStorage } from './logoStorage.service.js'
import { emitWorkspaceRemoved } from '../../realtime/realtime.emitter.js'

export const LOGO_MAX_BYTES = 2 * 1024 * 1024
const LOGO_MIME = ['image/png', 'image/jpeg', 'image/svg+xml']

const LOCALES = ['en', 'fr', 'ar'] as const
const VISIBILITIES = ['PUBLIC', 'PRIVATE', 'INVITE_ONLY'] as const
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const nameSchema = z.string().trim().min(2, 'Name must be at least 2 characters').max(60)
const descriptionSchema = z.string().trim().max(280, 'Description must be 280 characters or fewer')
const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, 'URL must be at least 2 characters')
  .max(60)
  .regex(SLUG_RE, 'Use lowercase letters, numbers and single hyphens')

const workspaceInput = z.object({
  name: nameSchema,
  description: descriptionSchema.optional(),
})

const workspaceUpdateInput = z
  .object({
    name: nameSchema,
    slug: slugSchema,
    description: descriptionSchema.nullable(),
    logoUrl: z.string().url().nullable(),
    locale: z.enum(LOCALES),
    visibility: z.enum(VISIBILITIES),
    defaultMemberRole: z.enum(['ADMIN', 'MEMBER']),
  })
  .partial()

const memberSelect = { id: true, name: true, email: true, avatarUrl: true } as const

type WorkspaceScalars = {
  id: string
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  locale: string
  visibility: Visibility
  defaultMemberRole: MemberRole
}

function toSummary(
  ws: WorkspaceScalars & { _count: { members: number; boards: number } },
  role: MemberRole,
) {
  return {
    id: ws.id,
    name: ws.name,
    slug: ws.slug,
    description: ws.description,
    logoUrl: ws.logoUrl,
    locale: ws.locale,
    visibility: ws.visibility,
    defaultMemberRole: ws.defaultMemberRole,
    role,
    _count: ws._count,
  }
}

async function ensureSlugFree(slug: string, exceptId?: string): Promise<void> {
  const existing = await prisma.workspace.findUnique({ where: { slug }, select: { id: true } })
  if (existing && existing.id !== exceptId) {
    throw new HttpError(409, 'That workspace URL is already taken')
  }
}

export async function listWorkspaces(req: Request, res: Response): Promise<void> {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: req.userId },
    orderBy: { workspace: { createdAt: 'asc' } },
    include: {
      workspace: { include: { _count: { select: { members: true, boards: true } } } },
    },
  })
  res.json(memberships.map((m) => toSummary(m.workspace, m.role)))
}

export async function checkSlugAvailability(req: Request, res: Response): Promise<void> {
  const raw = typeof req.query.slug === 'string' ? req.query.slug : ''
  const excludeId = typeof req.query.excludeId === 'string' ? req.query.excludeId : undefined
  const slug = slugify(raw)
  if (!slugSchema.safeParse(slug).success) {
    res.json({ slug, valid: false, available: false })
    return
  }
  const existing = await prisma.workspace.findUnique({ where: { slug }, select: { id: true } })
  res.json({ slug, valid: true, available: !existing || existing.id === excludeId })
}

export async function createWorkspace(req: Request, res: Response): Promise<void> {
  const data = workspaceInput.parse(req.body)
  if (!req.userId) throw new HttpError(401, 'Authentication required')
  const ws = await prisma.workspace.create({
    data: {
      name: data.name,
      slug: await generateUniqueSlug(data.name),
      description: data.description,
      ownerId: req.userId,
      members: { create: { userId: req.userId, role: 'OWNER' } },
    },
    include: { _count: { select: { members: true, boards: true } } },
  })
  res.status(201).json(toSummary(ws, 'OWNER'))
}

export async function getWorkspace(req: Request, res: Response): Promise<void> {
  const role = await assertWorkspaceRole(req.userId!, req.params.id, ['OWNER', 'ADMIN', 'MEMBER'])
  const ws = await prisma.workspace.findUnique({
    where: { id: req.params.id },
    include: {
      _count: { select: { members: true, boards: true } },
      members: { include: { user: { select: memberSelect } } },
    },
  })
  if (!ws) throw new HttpError(404, 'Workspace not found')
  res.json({
    ...toSummary(ws, role),
    members: ws.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      createdAt: m.createdAt,
      user: m.user,
    })),
  })
}

const ACTIVITY_FEED_LIMIT = 15

const activityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
})

export async function getWorkspaceActivity(req: Request, res: Response): Promise<void> {
  await assertWorkspaceRole(req.userId!, req.params.id, ['OWNER', 'ADMIN', 'MEMBER'])
  const parsed = activityQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid input')
  }
  const activities = await prisma.activity.findMany({
    where: { board: { workspaceId: req.params.id } },
    orderBy: { createdAt: 'desc' },
    take: parsed.data.limit ?? ACTIVITY_FEED_LIMIT,
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      card: { select: { id: true, title: true } },
      board: { select: { id: true, title: true } },
    },
  })
  res.json(activities)
}

export async function updateWorkspace(req: Request, res: Response): Promise<void> {
  const role = await assertWorkspaceRole(req.userId!, req.params.id, ['OWNER', 'ADMIN'])
  const data = workspaceUpdateInput.parse(req.body)
  if (data.slug) await ensureSlugFree(data.slug, req.params.id)
  const ws = await prisma.workspace.update({
    where: { id: req.params.id },
    data,
    include: { _count: { select: { members: true, boards: true } } },
  })
  res.json(toSummary(ws, role))
}

export async function uploadLogo(req: Request, res: Response): Promise<void> {
  const role = await assertWorkspaceRole(req.userId!, req.params.id, ['OWNER', 'ADMIN'])
  const file = req.file
  if (!file) throw new HttpError(400, 'No logo file provided')
  if (!LOGO_MIME.includes(file.mimetype)) {
    throw new HttpError(415, 'Logo must be a PNG, JPG or SVG image')
  }
  const logoUrl = await logoStorage.upload(req.params.id, {
    buffer: file.buffer,
    mimetype: file.mimetype,
  })
  const ws = await prisma.workspace.update({
    where: { id: req.params.id },
    data: { logoUrl },
    include: { _count: { select: { members: true, boards: true } } },
  })
  res.json(toSummary(ws, role))
}

export async function removeLogo(req: Request, res: Response): Promise<void> {
  const role = await assertWorkspaceRole(req.userId!, req.params.id, ['OWNER', 'ADMIN'])
  await logoStorage.remove(req.params.id)
  const ws = await prisma.workspace.update({
    where: { id: req.params.id },
    data: { logoUrl: null },
    include: { _count: { select: { members: true, boards: true } } },
  })
  res.json(toSummary(ws, role))
}

export async function deleteWorkspace(req: Request, res: Response): Promise<void> {
  await assertWorkspaceRole(req.userId!, req.params.id, ['OWNER'])
  await prisma.workspace.delete({ where: { id: req.params.id } })
  res.status(204).end()
}

const transferInput = z.object({ userId: z.string().min(1, 'A target member is required') })

export async function transferOwnership(req: Request, res: Response): Promise<void> {
  await assertWorkspaceRole(req.userId!, req.params.id, ['OWNER'])
  const { userId: targetId } = transferInput.parse(req.body)
  if (targetId === req.userId) throw new HttpError(400, 'You already own this workspace')

  const target = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: req.params.id, userId: targetId } },
  })
  if (!target) throw new HttpError(404, 'That user is not a member of this workspace')

  await prisma.$transaction([
    prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId: req.params.id, userId: targetId } },
      data: { role: 'OWNER' },
    }),
    prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId: req.params.id, userId: req.userId! } },
      data: { role: 'ADMIN' },
    }),
    prisma.workspace.update({ where: { id: req.params.id }, data: { ownerId: targetId } }),
  ])

  const ws = await prisma.workspace.findUnique({
    where: { id: req.params.id },
    include: {
      _count: { select: { members: true, boards: true } },
      members: { include: { user: { select: memberSelect } } },
    },
  })
  if (!ws) throw new HttpError(404, 'Workspace not found')
  res.json({
    ...toSummary(ws, 'ADMIN'),
    members: ws.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      createdAt: m.createdAt,
      user: m.user,
    })),
  })
}

const roleInput = z.object({ role: z.enum(['OWNER', 'ADMIN', 'MEMBER']) })

export async function updateMemberRole(req: Request, res: Response): Promise<void> {
  await assertWorkspaceRole(req.userId!, req.params.id, ['OWNER'])
  const { role } = roleInput.parse(req.body)
  if (role !== 'OWNER') await assertNotLastOwner(req.params.id, req.params.userId)
  const member = await prisma.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId: req.params.id, userId: req.params.userId } },
    data: { role },
    include: { user: { select: memberSelect } },
  })
  res.json({
    id: member.id,
    userId: member.userId,
    role: member.role,
    createdAt: member.createdAt,
    user: member.user,
  })
}

export async function removeMember(req: Request, res: Response): Promise<void> {
  const isSelf = req.userId === req.params.userId
  if (!isSelf) await assertWorkspaceRole(req.userId!, req.params.id, ['OWNER', 'ADMIN'])
  else await assertWorkspaceRole(req.userId!, req.params.id, ['OWNER', 'ADMIN', 'MEMBER'])
  await assertNotLastOwner(req.params.id, req.params.userId)
  await prisma.workspaceMember.delete({
    where: { workspaceId_userId: { workspaceId: req.params.id, userId: req.params.userId } },
  })
  emitWorkspaceRemoved(req.params.userId, req.params.id)
  res.status(204).end()
}

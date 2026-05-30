import type { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../prisma/prisma.service.js'
import { HttpError } from '../../common/errorHandler.js'
import { assertWorkspaceRole } from './workspace.service.js'
import { emitWorkspaceAdded } from '../../realtime/realtime.emitter.js'
import { notifyWorkspaceInvite } from '../notification/notification.triggers.js'

const inviteInput = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
})

const inviteRoleInput = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
})

const inviteSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  workspace: { select: { id: true, name: true } },
  invitedBy: { select: { id: true, name: true } },
} as const

export async function createInvite(req: Request, res: Response): Promise<void> {
  await assertWorkspaceRole(req.userId!, req.params.id, ['OWNER', 'ADMIN'])
  const data = inviteInput.parse(req.body)

  const invitee = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  })
  if (!invitee) {
    throw new HttpError(404, 'No account found with that email. They need to sign up first')
  }

  let role = data.role
  if (!role) {
    const ws = await prisma.workspace.findUnique({
      where: { id: req.params.id },
      select: { defaultMemberRole: true },
    })
    role = ws?.defaultMemberRole === 'ADMIN' ? 'ADMIN' : 'MEMBER'
  }

  const already = await prisma.workspaceMember.findFirst({
    where: { workspaceId: req.params.id, user: { email: data.email } },
  })
  if (already) throw new HttpError(409, 'That person is already a member of this workspace')

  const existing = await prisma.workspaceInvite.findUnique({
    where: { workspaceId_email: { workspaceId: req.params.id, email: data.email } },
  })
  if (existing && existing.status === 'PENDING') {
    throw new HttpError(409, 'An invite for that email is already pending')
  }

  const invite = await prisma.workspaceInvite.upsert({
    where: { workspaceId_email: { workspaceId: req.params.id, email: data.email } },
    create: {
      workspaceId: req.params.id,
      email: data.email,
      role,
      invitedById: req.userId!,
    },
    update: { role, status: 'PENDING', invitedById: req.userId! },
    select: inviteSelect,
  })

  await notifyWorkspaceInvite(req.userId!, invite.invitedBy.name, invitee.id, invite.workspace)

  res.status(201).json(invite)
}

export async function listWorkspaceInvites(req: Request, res: Response): Promise<void> {
  await assertWorkspaceRole(req.userId!, req.params.id, ['OWNER', 'ADMIN'])
  const invites = await prisma.workspaceInvite.findMany({
    where: { workspaceId: req.params.id, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    select: inviteSelect,
  })
  res.json(invites)
}

export async function updateInvite(req: Request, res: Response): Promise<void> {
  await assertWorkspaceRole(req.userId!, req.params.id, ['OWNER', 'ADMIN'])
  const { role } = inviteRoleInput.parse(req.body)

  const invite = await prisma.workspaceInvite.findUnique({ where: { id: req.params.inviteId } })
  if (!invite || invite.workspaceId !== req.params.id || invite.status !== 'PENDING') {
    throw new HttpError(404, 'Invite not found')
  }

  const updated = await prisma.workspaceInvite.update({
    where: { id: req.params.inviteId },
    data: { role },
    select: inviteSelect,
  })
  res.json(updated)
}

export async function revokeInvite(req: Request, res: Response): Promise<void> {
  await assertWorkspaceRole(req.userId!, req.params.id, ['OWNER', 'ADMIN'])
  await prisma.workspaceInvite.delete({ where: { id: req.params.inviteId } })
  res.status(204).end()
}

export async function listMyInvites(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) throw new HttpError(404, 'User not found')
  const invites = await prisma.workspaceInvite.findMany({
    where: { email: user.email, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    select: inviteSelect,
  })
  res.json(invites)
}

export async function acceptInvite(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) throw new HttpError(404, 'User not found')
  const invite = await prisma.workspaceInvite.findUnique({ where: { id: req.params.id } })
  if (!invite || invite.status !== 'PENDING' || invite.email !== user.email) {
    throw new HttpError(404, 'Invite not found')
  }
  await prisma.$transaction([
    prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: user.id } },
      create: { workspaceId: invite.workspaceId, userId: user.id, role: invite.role },
      update: { role: invite.role },
    }),
    prisma.workspaceInvite.update({ where: { id: invite.id }, data: { status: 'ACCEPTED' } }),
  ])
  emitWorkspaceAdded(user.id, invite.workspaceId)
  res.status(204).end()
}

export async function declineInvite(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) throw new HttpError(404, 'User not found')
  const invite = await prisma.workspaceInvite.findUnique({ where: { id: req.params.id } })
  if (!invite || invite.status !== 'PENDING' || invite.email !== user.email) {
    throw new HttpError(404, 'Invite not found')
  }
  await prisma.workspaceInvite.update({ where: { id: invite.id }, data: { status: 'DECLINED' } })
  res.status(204).end()
}

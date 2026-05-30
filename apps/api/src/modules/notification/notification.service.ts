import type { Notification, NotificationType, Prisma } from '@prisma/client'
import { prisma } from '../../prisma/prisma.service.js'
import { emitNotification } from '../../realtime/realtime.emitter.js'

export const NOTIFICATION_TTL_DAYS = 30

const PREF_FIELD: Record<NotificationType, keyof NotificationPreferenceFlags> = {
  CARD_ASSIGNED: 'cardAssigned',
  MENTION: 'mention',
  COMMENT_ON_ASSIGNED: 'commentOnAssigned',
  WORKSPACE_INVITE: 'workspaceInvite',
  CARD_MOVED: 'cardMoved',
  STATUS_CHANGED: 'statusChanged',
}

interface NotificationPreferenceFlags {
  cardAssigned: boolean
  mention: boolean
  commentOnAssigned: boolean
  workspaceInvite: boolean
  cardMoved: boolean
  statusChanged: boolean
}

export const DEFAULT_PREFERENCES: NotificationPreferenceFlags = {
  cardAssigned: true,
  mention: true,
  commentOnAssigned: true,
  workspaceInvite: true,
  cardMoved: true,
  statusChanged: true,
}

export interface CreateNotificationInput {
  recipientId: string
  type: NotificationType
  actorId?: string
  workspaceId?: string
  boardId?: string
  cardId?: string
  data: Prisma.InputJsonValue
}

const notificationSelect = {
  id: true,
  type: true,
  workspaceId: true,
  boardId: true,
  cardId: true,
  data: true,
  readAt: true,
  createdAt: true,
  actor: { select: { id: true, name: true, avatarUrl: true } },
} as const

export async function createNotification(
  input: CreateNotificationInput,
): Promise<Notification | null> {
  const { recipientId, type, actorId, workspaceId, boardId, cardId, data } = input

  if (actorId && actorId === recipientId) return null

  const [pref, mute] = await Promise.all([
    prisma.notificationPreference.findUnique({ where: { userId: recipientId } }),
    workspaceId || boardId
      ? prisma.notificationMute.findFirst({
          where: {
            userId: recipientId,
            OR: [...(workspaceId ? [{ workspaceId }] : []), ...(boardId ? [{ boardId }] : [])],
          },
          select: { id: true },
        })
      : null,
  ])

  if (mute) return null
  if (pref && pref[PREF_FIELD[type]] === false) return null

  if (workspaceId && type !== 'WORKSPACE_INVITE') {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: recipientId } },
      select: { id: true },
    })
    if (!member) return null
  }

  const notification = await prisma.notification.create({
    data: { userId: recipientId, type, actorId, workspaceId, boardId, cardId, data },
    select: notificationSelect,
  })

  const muted = pref?.dndUntil ? pref.dndUntil.getTime() > Date.now() : false
  if (!muted) emitNotification(recipientId, { ...notification, workspaceActive: true })

  return notification as unknown as Notification
}

export async function listNotifications(userId: string) {
  await pruneExpired(userId)

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: notificationSelect,
  })

  const workspaceIds = [
    ...new Set(notifications.map((n) => n.workspaceId).filter((id): id is string => Boolean(id))),
  ]
  const memberships = workspaceIds.length
    ? await prisma.workspaceMember.findMany({
        where: { userId, workspaceId: { in: workspaceIds } },
        select: { workspaceId: true },
      })
    : []
  const activeWorkspaceIds = new Set(memberships.map((m) => m.workspaceId))

  return notifications.map((n) => ({
    ...n,
    workspaceActive:
      n.type === 'WORKSPACE_INVITE' || !n.workspaceId
        ? true
        : activeWorkspaceIds.has(n.workspaceId),
  }))
}

export async function countUnread(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } })
}

export async function markRead(userId: string, id: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  })
}

export async function markAllRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  })
}

export async function clearNotification(userId: string, id: string): Promise<void> {
  await prisma.notification.deleteMany({ where: { id, userId } })
}

export async function clearAll(userId: string): Promise<void> {
  await prisma.notification.deleteMany({ where: { userId } })
}

async function pruneExpired(userId: string): Promise<void> {
  const cutoff = new Date(Date.now() - NOTIFICATION_TTL_DAYS * 24 * 60 * 60 * 1000)
  await prisma.notification.deleteMany({ where: { userId, createdAt: { lt: cutoff } } })
}

export async function getPreferences(userId: string) {
  const [pref, mutes] = await Promise.all([
    prisma.notificationPreference.findUnique({ where: { userId } }),
    prisma.notificationMute.findMany({
      where: { userId },
      select: {
        id: true,
        workspaceId: true,
        boardId: true,
        workspace: { select: { id: true, name: true } },
        board: { select: { id: true, title: true } },
      },
    }),
  ])

  return {
    ...DEFAULT_PREFERENCES,
    ...(pref
      ? {
          cardAssigned: pref.cardAssigned,
          mention: pref.mention,
          commentOnAssigned: pref.commentOnAssigned,
          workspaceInvite: pref.workspaceInvite,
          cardMoved: pref.cardMoved,
          statusChanged: pref.statusChanged,
        }
      : {}),
    dndUntil: pref?.dndUntil ?? null,
    mutes,
  }
}

export interface UpdatePreferencesInput {
  cardAssigned?: boolean
  mention?: boolean
  commentOnAssigned?: boolean
  workspaceInvite?: boolean
  cardMoved?: boolean
  statusChanged?: boolean
  dndUntil?: Date | null
}

export async function updatePreferences(userId: string, input: UpdatePreferencesInput) {
  const pref = await prisma.notificationPreference.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
  })
  return pref
}

export async function addMute(
  userId: string,
  target: { workspaceId?: string; boardId?: string },
): Promise<void> {
  await prisma.notificationMute.create({
    data: { userId, workspaceId: target.workspaceId, boardId: target.boardId },
  })
}

export async function removeMute(userId: string, id: string): Promise<void> {
  await prisma.notificationMute.deleteMany({ where: { id, userId } })
}

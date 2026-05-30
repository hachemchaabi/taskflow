import type { Request, Response } from 'express'
import { z } from 'zod'
import { HttpError } from '../../common/errorHandler.js'
import {
  addMute,
  clearAll,
  clearNotification,
  countUnread,
  getPreferences,
  listNotifications,
  markAllRead,
  markRead,
  removeMute,
  updatePreferences,
} from './notification.service.js'

export async function getNotifications(req: Request, res: Response): Promise<void> {
  res.json(await listNotifications(req.userId!))
}

export async function getUnreadCount(req: Request, res: Response): Promise<void> {
  res.json({ count: await countUnread(req.userId!) })
}

export async function readNotification(req: Request, res: Response): Promise<void> {
  await markRead(req.userId!, req.params.id)
  res.status(204).end()
}

export async function readAllNotifications(req: Request, res: Response): Promise<void> {
  await markAllRead(req.userId!)
  res.status(204).end()
}

export async function deleteNotification(req: Request, res: Response): Promise<void> {
  await clearNotification(req.userId!, req.params.id)
  res.status(204).end()
}

export async function deleteAllNotifications(req: Request, res: Response): Promise<void> {
  await clearAll(req.userId!)
  res.status(204).end()
}

export async function getNotificationPreferences(req: Request, res: Response): Promise<void> {
  res.json(await getPreferences(req.userId!))
}

const preferencesInput = z.object({
  cardAssigned: z.boolean().optional(),
  mention: z.boolean().optional(),
  commentOnAssigned: z.boolean().optional(),
  workspaceInvite: z.boolean().optional(),
  cardMoved: z.boolean().optional(),
  statusChanged: z.boolean().optional(),
  dndUntil: z.string().datetime().nullable().optional(),
})

export async function patchNotificationPreferences(req: Request, res: Response): Promise<void> {
  const data = preferencesInput.parse(req.body)
  const { dndUntil, ...flags } = data
  await updatePreferences(req.userId!, {
    ...flags,
    ...(dndUntil !== undefined ? { dndUntil: dndUntil ? new Date(dndUntil) : null } : {}),
  })
  res.json(await getPreferences(req.userId!))
}

const muteInput = z
  .object({
    workspaceId: z.string().min(1).optional(),
    boardId: z.string().min(1).optional(),
  })
  .refine((v) => Boolean(v.workspaceId) !== Boolean(v.boardId), {
    message: 'Provide exactly one of workspaceId or boardId',
  })

export async function createMute(req: Request, res: Response): Promise<void> {
  const target = muteInput.parse(req.body)
  try {
    await addMute(req.userId!, target)
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as { code?: string }).code === 'P2002') {
      throw new HttpError(409, 'That board or workspace is already muted')
    }
    throw err
  }
  res.status(201).json(await getPreferences(req.userId!))
}

export async function deleteMute(req: Request, res: Response): Promise<void> {
  await removeMute(req.userId!, req.params.id)
  res.json(await getPreferences(req.userId!))
}

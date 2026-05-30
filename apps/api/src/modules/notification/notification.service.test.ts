import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../prisma/prisma.service.js', () => ({
  prisma: {
    notificationPreference: { findUnique: vi.fn() },
    notificationMute: { findFirst: vi.fn() },
    workspaceMember: { findUnique: vi.fn() },
    notification: { create: vi.fn() },
  },
}))
vi.mock('../../realtime/realtime.emitter.js', () => ({
  emitNotification: vi.fn(),
}))

import { createNotification } from './notification.service.js'
import { prisma } from '../../prisma/prisma.service.js'
import { emitNotification } from '../../realtime/realtime.emitter.js'

const base = {
  recipientId: 'u1',
  type: 'CARD_ASSIGNED' as const,
  actorId: 'u2',
  workspaceId: 'w1',
  boardId: 'b1',
  cardId: 'c1',
  data: { title: 'Card', message: 'assigned you' },
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(prisma.notificationPreference.findUnique).mockResolvedValue(null)
  vi.mocked(prisma.notificationMute.findFirst).mockResolvedValue(null)
  vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({ id: 'm1' } as never)
  vi.mocked(prisma.notification.create).mockResolvedValue({ id: 'n1' } as never)
})

describe('createNotification gating', () => {
  it('skips when the actor is the recipient', async () => {
    const result = await createNotification({ ...base, actorId: 'u1' })
    expect(result).toBeNull()
    expect(prisma.notification.create).not.toHaveBeenCalled()
  })

  it('skips when the type is switched off in preferences', async () => {
    vi.mocked(prisma.notificationPreference.findUnique).mockResolvedValue({
      cardAssigned: false,
      dndUntil: null,
    } as never)
    expect(await createNotification(base)).toBeNull()
    expect(prisma.notification.create).not.toHaveBeenCalled()
  })

  it('skips when the board or workspace is muted', async () => {
    vi.mocked(prisma.notificationMute.findFirst).mockResolvedValue({ id: 'mute1' } as never)
    expect(await createNotification(base)).toBeNull()
    expect(prisma.notification.create).not.toHaveBeenCalled()
  })

  it('skips when the recipient is no longer a workspace member', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null)
    expect(await createNotification(base)).toBeNull()
    expect(prisma.notification.create).not.toHaveBeenCalled()
  })

  it('delivers a workspace invite even though the invitee is not yet a member', async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null)
    const result = await createNotification({
      ...base,
      type: 'WORKSPACE_INVITE',
      cardId: undefined,
    })
    expect(result).not.toBeNull()
    expect(prisma.workspaceMember.findUnique).not.toHaveBeenCalled()
    expect(emitNotification).toHaveBeenCalledWith('u1', { id: 'n1', workspaceActive: true })
  })

  it('creates and emits on the happy path', async () => {
    const result = await createNotification(base)
    expect(result).toEqual({ id: 'n1' })
    expect(emitNotification).toHaveBeenCalledTimes(1)
  })

  it('records the row but stays silent during Do Not Disturb', async () => {
    vi.mocked(prisma.notificationPreference.findUnique).mockResolvedValue({
      cardAssigned: true,
      dndUntil: new Date(Date.now() + 60_000),
    } as never)
    const result = await createNotification(base)
    expect(result).not.toBeNull()
    expect(prisma.notification.create).toHaveBeenCalledTimes(1)
    expect(emitNotification).not.toHaveBeenCalled()
  })
})

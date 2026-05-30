import type { Server as HttpServer } from 'node:http'
import { Server, type Socket } from 'socket.io'
import { env } from '../config/env.js'
import { prisma } from '../prisma/prisma.service.js'
import { verifyAccessToken } from '../modules/auth/auth.service.js'
import { assertBoardAccess } from '../modules/card/card.service.js'
import { assertWorkspaceRole } from '../modules/workspace/workspace.service.js'
import * as presence from './presence.registry.js'
import { boardRoom, registerIo, userRoom, workspaceRoom } from './realtime.emitter.js'
import {
  DEFAULT_BOARD_CONTEXT,
  REALTIME_EVENTS,
  type PresenceContext,
  type TypingPayload,
} from './realtime.events.js'

const WRITE_ROLES = ['OWNER', 'ADMIN', 'MEMBER'] as const

interface SocketUser {
  id: string
  name: string
  avatarUrl: string | null
}

function userOf(socket: Socket): SocketUser {
  return socket.data.user as SocketUser
}

type AckResponse = { ok: true } | { ok: false; error: string }

function ack(cb: unknown, response: AckResponse): void {
  if (typeof cb === 'function') (cb as (r: AckResponse) => void)(response)
}

async function authenticate(socket: Socket): Promise<SocketUser> {
  const token = socket.handshake.auth?.token as string | undefined
  if (!token) throw new Error('missing token')
  const userId = verifyAccessToken(token)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, avatarUrl: true },
  })
  if (!user) throw new Error('unknown user')
  return user
}

export function initRealtime(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: env.clientOrigin.split(','), credentials: true },
  })

  io.use((socket, next) => {
    authenticate(socket)
      .then((user) => {
        socket.data.user = user
        next()
      })
      .catch(() => next(new Error('unauthorized')))
  })

  io.on('connection', (socket) => {
    const user = userOf(socket)
    void socket.join(userRoom(user.id))

    socket.on(REALTIME_EVENTS.joinBoard, async (payload: { boardId?: string }, cb: unknown) => {
      const boardId = payload?.boardId
      if (!boardId) return ack(cb, { ok: false, error: 'boardId required' })
      try {
        await assertBoardAccess(user.id, boardId)
      } catch {
        return ack(cb, { ok: false, error: 'forbidden' })
      }
      void socket.join(boardRoom(boardId))
      const users = presence.join(boardId, socket.id, user)
      io.to(boardRoom(boardId)).emit(REALTIME_EVENTS.presenceState, { boardId, users })
      ack(cb, { ok: true })
    })

    socket.on(REALTIME_EVENTS.leaveBoard, (payload: { boardId?: string }, cb: unknown) => {
      const boardId = payload?.boardId
      if (!boardId) return ack(cb, { ok: false, error: 'boardId required' })
      void socket.leave(boardRoom(boardId))
      const users = presence.leave(boardId, socket.id)
      io.to(boardRoom(boardId)).emit(REALTIME_EVENTS.presenceState, { boardId, users })
      ack(cb, { ok: true })
    })

    socket.on(
      REALTIME_EVENTS.joinWorkspace,
      async (payload: { workspaceId?: string }, cb: unknown) => {
        const workspaceId = payload?.workspaceId
        if (!workspaceId) return ack(cb, { ok: false, error: 'workspaceId required' })
        try {
          await assertWorkspaceRole(user.id, workspaceId, [...WRITE_ROLES])
        } catch {
          return ack(cb, { ok: false, error: 'forbidden' })
        }
        void socket.join(workspaceRoom(workspaceId))
        ack(cb, { ok: true })
      },
    )

    socket.on(REALTIME_EVENTS.leaveWorkspace, (payload: { workspaceId?: string }, cb: unknown) => {
      const workspaceId = payload?.workspaceId
      if (!workspaceId) return ack(cb, { ok: false, error: 'workspaceId required' })
      void socket.leave(workspaceRoom(workspaceId))
      ack(cb, { ok: true })
    })

    socket.on(
      REALTIME_EVENTS.presenceContext,
      (payload: { boardId?: string; context?: PresenceContext }) => {
        const boardId = payload?.boardId
        if (!boardId) return
        const context = payload.context ?? { ...DEFAULT_BOARD_CONTEXT }
        const users = presence.setContext(boardId, user.id, context)
        io.to(boardRoom(boardId)).emit(REALTIME_EVENTS.presenceState, { boardId, users })
      },
    )

    socket.on(REALTIME_EVENTS.typing, (payload: TypingPayload) => {
      if (!payload?.boardId || !payload?.cardId) return
      socket.to(boardRoom(payload.boardId)).emit(REALTIME_EVENTS.typingState, {
        cardId: payload.cardId,
        user: { id: user.id, name: user.name },
      })
    })

    socket.on('disconnect', () => {
      for (const { boardId, presence: users } of presence.leaveAllForSocket(socket.id)) {
        io.to(boardRoom(boardId)).emit(REALTIME_EVENTS.presenceState, { boardId, users })
      }
    })
  })

  registerIo(io)
  return io
}

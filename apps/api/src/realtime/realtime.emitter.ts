import type { Server } from 'socket.io'
import { REALTIME_EVENTS, type Actor, type BoardChangedKind } from './realtime.events.js'

let io: Server | null = null

export function registerIo(server: Server): void {
  io = server
}

export const boardRoom = (boardId: string): string => `board:${boardId}`
export const workspaceRoom = (workspaceId: string): string => `workspace:${workspaceId}`
export const userRoom = (userId: string): string => `user:${userId}`

export function emitBoardChanged(
  boardId: string,
  kind: BoardChangedKind,
  actor: Actor,
  cardId?: string,
): void {
  io?.to(boardRoom(boardId)).emit(REALTIME_EVENTS.boardChanged, { boardId, kind, cardId, actor })
}

export function emitCardChanged(cardId: string, boardId: string, actor: Actor): void {
  io?.to(boardRoom(boardId)).emit(REALTIME_EVENTS.cardChanged, { cardId, boardId, actor })
}

export function emitBoardsChanged(workspaceId: string, actor: Actor): void {
  io?.to(workspaceRoom(workspaceId)).emit(REALTIME_EVENTS.boardsChanged, { workspaceId, actor })
}

export function emitWorkspaceRemoved(userId: string, workspaceId: string): void {
  io?.to(userRoom(userId)).emit(REALTIME_EVENTS.workspaceRemoved, { workspaceId })
}

export function emitWorkspaceAdded(userId: string, workspaceId: string): void {
  io?.to(userRoom(userId)).emit(REALTIME_EVENTS.workspaceAdded, { workspaceId })
}

export function emitNotification(userId: string, notification: unknown): void {
  io?.to(userRoom(userId)).emit(REALTIME_EVENTS.notification, notification)
}

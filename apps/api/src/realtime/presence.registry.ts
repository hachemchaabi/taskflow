import {
  DEFAULT_BOARD_CONTEXT,
  type PresenceContext,
  type PresenceUser,
} from './realtime.events.js'

interface UserIdentity {
  id: string
  name: string
  avatarUrl: string | null
}

interface Entry {
  identity: UserIdentity
  socketIds: Set<string>
  context: PresenceContext
}

const boards = new Map<string, Map<string, Entry>>()

function toPresence(entry: Entry): PresenceUser {
  return {
    id: entry.identity.id,
    name: entry.identity.name,
    avatarUrl: entry.identity.avatarUrl,
    context: entry.context,
  }
}

export function list(boardId: string): PresenceUser[] {
  const users = boards.get(boardId)
  if (!users) return []
  return [...users.values()].map(toPresence).sort((a, b) => a.id.localeCompare(b.id))
}

export function join(boardId: string, socketId: string, identity: UserIdentity): PresenceUser[] {
  let users = boards.get(boardId)
  if (!users) {
    users = new Map()
    boards.set(boardId, users)
  }
  const existing = users.get(identity.id)
  if (existing) {
    existing.socketIds.add(socketId)
    existing.identity = identity
  } else {
    users.set(identity.id, {
      identity,
      socketIds: new Set([socketId]),
      context: { ...DEFAULT_BOARD_CONTEXT },
    })
  }
  return list(boardId)
}

export function leave(boardId: string, socketId: string): PresenceUser[] {
  const users = boards.get(boardId)
  if (!users) return []
  for (const [userId, entry] of users) {
    if (!entry.socketIds.delete(socketId)) continue
    if (entry.socketIds.size === 0) users.delete(userId)
    break
  }
  if (users.size === 0) boards.delete(boardId)
  return list(boardId)
}

export function leaveAllForSocket(
  socketId: string,
): { boardId: string; presence: PresenceUser[] }[] {
  const affected: { boardId: string; presence: PresenceUser[] }[] = []
  for (const [boardId, users] of boards) {
    const present = [...users.values()].some((e) => e.socketIds.has(socketId))
    if (present) affected.push({ boardId, presence: leave(boardId, socketId) })
  }
  return affected
}

export function setContext(
  boardId: string,
  userId: string,
  context: PresenceContext,
): PresenceUser[] {
  const entry = boards.get(boardId)?.get(userId)
  if (entry) entry.context = context
  return list(boardId)
}

export function reset(): void {
  boards.clear()
}

export const REALTIME_EVENTS = {
  boardChanged: 'board:changed',
  cardChanged: 'card:changed',
  boardsChanged: 'boards:changed',
  workspaceRemoved: 'workspace:removed',
  workspaceAdded: 'workspace:added',
  presenceState: 'presence:state',
  presenceContext: 'presence:context',
  typing: 'typing',
  typingState: 'typing:state',
  joinBoard: 'join:board',
  leaveBoard: 'leave:board',
  joinWorkspace: 'join:workspace',
  leaveWorkspace: 'leave:workspace',
  notification: 'notification:new',
} as const

export interface Actor {
  id: string
  name: string
}

export type PresenceContextType = 'board' | 'card'

export interface PresenceContext {
  type: PresenceContextType
  cardId?: string
  cardTitle?: string
  editing: boolean
}

export interface PresenceUser {
  id: string
  name: string
  avatarUrl: string | null
  context: PresenceContext
}

export interface PresenceStatePayload {
  boardId: string
  users: PresenceUser[]
}

export type BoardChangedKind =
  | 'card.created'
  | 'card.updated'
  | 'card.moved'
  | 'card.deleted'
  | 'comment.created'
  | 'comment.updated'
  | 'comment.deleted'

export interface BoardChangedPayload {
  boardId: string
  kind: BoardChangedKind
  cardId?: string
  actor: Actor
}

export interface CardChangedPayload {
  cardId: string
  boardId: string
  actor: Actor
}

export interface BoardsChangedPayload {
  workspaceId: string
  actor: Actor
}

export interface WorkspacePayload {
  workspaceId: string
}

export interface TypingPayload {
  boardId: string
  cardId: string
}

export interface TypingStatePayload {
  cardId: string
  user: Actor
}

export const DEFAULT_BOARD_CONTEXT: PresenceContext = { type: 'board', editing: false }

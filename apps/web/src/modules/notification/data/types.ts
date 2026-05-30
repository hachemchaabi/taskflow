export type NotificationType =
  | 'CARD_ASSIGNED'
  | 'MENTION'
  | 'COMMENT_ON_ASSIGNED'
  | 'WORKSPACE_INVITE'
  | 'CARD_MOVED'
  | 'STATUS_CHANGED'

export interface NotificationActor {
  id: string
  name: string
  avatarUrl: string | null
}

export interface NotificationData {
  title?: string
  message: string
  actorName?: string
  [key: string]: unknown
}

export interface AppNotification {
  id: string
  type: NotificationType
  workspaceId: string | null
  boardId: string | null
  cardId: string | null
  data: NotificationData
  readAt: string | null
  createdAt: string
  actor: NotificationActor | null
  /** False once the recipient has left the notification's workspace (Epic 8.5). */
  workspaceActive: boolean
}

export interface NotificationMute {
  id: string
  workspaceId: string | null
  boardId: string | null
  workspace: { id: string; name: string } | null
  board: { id: string; title: string } | null
}

export interface NotificationPreferences {
  cardAssigned: boolean
  mention: boolean
  commentOnAssigned: boolean
  workspaceInvite: boolean
  cardMoved: boolean
  statusChanged: boolean
  dndUntil: string | null
  mutes: NotificationMute[]
}

export type NotificationToggle = Exclude<keyof NotificationPreferences, 'dndUntil' | 'mutes'>

export interface UpdatePreferencesInput {
  cardAssigned?: boolean
  mention?: boolean
  commentOnAssigned?: boolean
  workspaceInvite?: boolean
  cardMoved?: boolean
  statusChanged?: boolean
  dndUntil?: string | null
}

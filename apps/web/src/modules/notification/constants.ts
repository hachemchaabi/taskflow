import { Icons } from '@/lib/Icons'
import type { IconName } from '@/shared/ui/Icon'
import type { NotificationToggle, NotificationType } from './data/types'

export const NOTIFICATION_ICON: Record<NotificationType, IconName> = {
  CARD_ASSIGNED: Icons.user.add,
  MENTION: Icons.communication.message,
  COMMENT_ON_ASSIGNED: Icons.communication.chat,
  WORKSPACE_INVITE: Icons.user.users,
  CARD_MOVED: Icons.navigation.board,
  STATUS_CHANGED: Icons.ui.status,
}

export const WORKSPACE_UNAVAILABLE = 'This workspace is no longer available to you'

export const NOTIFICATION_TOGGLES: {
  key: NotificationToggle
  label: string
  description: string
}[] = [
  {
    key: 'cardAssigned',
    label: 'Card assignments',
    description: 'When someone assigns you to a card.',
  },
  {
    key: 'mention',
    label: 'Mentions',
    description: 'When someone @mentions you in a comment or description.',
  },
  {
    key: 'commentOnAssigned',
    label: 'Comments on your cards',
    description: "When someone comments on a card you're assigned to.",
  },
  {
    key: 'cardMoved',
    label: 'Card moved',
    description: "When a card you're assigned to is moved to another list.",
  },
  {
    key: 'statusChanged',
    label: 'Status changes',
    description: 'When the status of a card you created changes.',
  },
  {
    key: 'workspaceInvite',
    label: 'Workspace invites',
    description: 'When someone invites you to a workspace.',
  },
]

export const DND_PRESETS: { label: string; minutes: number }[] = [
  { label: '30 minutes', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '4 hours', minutes: 240 },
  { label: 'Until tomorrow', minutes: 24 * 60 },
]

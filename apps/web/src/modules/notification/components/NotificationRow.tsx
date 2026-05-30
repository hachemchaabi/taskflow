import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/Icon'
import { Icons } from '@/lib/Icons'
import { cn } from '@/lib/utils'
import { getInitials } from '@/shared/utils/getInitials'
import { NOTIFICATION_ICON, WORKSPACE_UNAVAILABLE } from '../constants'
import { formatNotificationDate } from '../utils'
import type { AppNotification } from '../data/types'

interface NotificationRowProps {
  notification: AppNotification
  now: Date
  interactive: boolean
  onOpen: (notification: AppNotification) => void
  onMarkRead: (notification: AppNotification) => void
  onClear: (notification: AppNotification) => void
}

export function NotificationRow({
  notification,
  now,
  interactive,
  onOpen,
  onMarkRead,
  onClear,
}: NotificationRowProps) {
  const actor = notification.actor
  const unread = notification.readAt === null
  const title =
    typeof notification.data.title === 'string' ? notification.data.title : 'Notification'
  const available = notification.workspaceActive

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onOpen(notification) : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onOpen(notification)
              }
            }
          : undefined
      }
      className={cn(
        'group/row relative flex items-center gap-3 px-4 py-3 text-sm transition-colors',
        interactive && 'cursor-pointer hover:bg-canvas-fog',
        !available && 'opacity-64',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-2 shrink-0 rounded-full',
          unread ? 'bg-chartwell-blue' : 'bg-transparent',
        )}
      />

      <Avatar className="size-8 shrink-0 rounded-lg text-xs">
        {actor?.avatarUrl ? (
          <AvatarImage src={actor.avatarUrl} alt={actor.name} className="rounded-lg" />
        ) : null}
        <AvatarFallback className="rounded-lg">{getInitials(actor?.name)}</AvatarFallback>
      </Avatar>

      <span className="w-40 shrink-0 truncate font-medium text-slate-text" title={title}>
        {title}
      </span>

      <span className="flex min-w-0 flex-1 items-center gap-2 text-muted-foreground">
        <Icon
          name={NOTIFICATION_ICON[notification.type]}
          size={16}
          color="currentColor"
          className="text-primary"
          aria-hidden="true"
        />
        <span className="truncate" title={notification.data.message}>
          {notification.data.message}
          {!available && <span className="text-steel-gray"> &middot; {WORKSPACE_UNAVAILABLE}</span>}
        </span>
      </span>

      {/* Date hides on hover to reveal the row actions. */}
      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground transition-opacity group-hover/row:opacity-0">
        <time dateTime={notification.createdAt} className="w-14 text-right tabular-nums">
          {formatNotificationDate(notification.createdAt, now)}
        </time>
      </div>

      <div className="absolute inset-y-0 right-3 hidden items-center gap-1 group-hover/row:flex">
        {unread && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Mark as read"
            onClick={(e) => {
              e.stopPropagation()
              onMarkRead(notification)
            }}
          >
            <Icon name={Icons.ui.check} size={16} aria-hidden="true" />
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onClear(notification)
          }}
        >
          <Icon name={Icons.actions.delete} size={14} aria-hidden="true" />
          Clear
        </Button>
      </div>
    </div>
  )
}

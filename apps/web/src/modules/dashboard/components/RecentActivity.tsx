import { Link } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/shared/ui/empty'
import { Icon } from '@/shared/ui/Icon'
import { Icons } from '@/lib/Icons'
import { Loading } from '@/shared/components/Loading'
import { getInitials } from '@/shared/utils/getInitials'
import { formatRelativeTime } from '../utils'
import type { WorkspaceActivity } from '../data/activityApi'

interface RecentActivityProps {
  activities: WorkspaceActivity[]
  loading: boolean
}

export function RecentActivity({ activities, loading }: RecentActivityProps) {
  if (loading && activities.length === 0) return <Loading label="Loading activity…" />

  if (activities.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon name={Icons.ui.clock} aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>No activity yet</EmptyTitle>
          <EmptyDescription>
            Updates to boards and tasks in this workspace will appear here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <ul className="space-y-4">
      {activities.map((activity) => (
        <li key={activity.id} className="flex items-start gap-3">
          <Avatar className="size-8 rounded-lg">
            {activity.user.avatarUrl ? (
              <AvatarImage src={activity.user.avatarUrl} alt="" className="rounded-lg" />
            ) : null}
            <AvatarFallback className="rounded-lg text-xs">
              {getInitials(activity.user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-sm">
            <p className="text-foreground">
              <span className="font-medium">{activity.user.name}</span> {activity.action}
              {activity.card ? (
                <>
                  {' '}
                  <Link
                    to={`/boards/${activity.board.id}?card=${activity.card.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {activity.card.title}
                  </Link>
                </>
              ) : null}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(activity.createdAt)} &middot; {activity.board.title}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

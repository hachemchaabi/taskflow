import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/Icon'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/shared/ui/empty'
import { Icons } from '@/lib/Icons'
import { getInitials } from '@/shared/utils/getInitials'
import type { WorkspaceInvite } from '@/shared/types'

interface InvitationsListProps {
  invites: WorkspaceInvite[]
  pendingId: string | null
  onRespond: (id: string, action: 'accept' | 'decline') => void
}

export function InvitationsList({ invites, pendingId, onRespond }: InvitationsListProps) {
  if (invites.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon name={Icons.navigation.inbox} aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>You&rsquo;re all caught up</EmptyTitle>
          <EmptyDescription>
            No pending invitations. When someone invites you to a workspace, it&rsquo;ll show up
            here for you to accept or decline.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <Card className="divide-y divide-stone-border overflow-hidden p-0">
      {invites.map((inv) => (
        <div key={inv.id} className="flex items-center gap-3 px-4 py-3 text-sm transition-colors">
          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-chartwell-blue" />

          <Avatar className="size-8 shrink-0 rounded-lg text-xs">
            <AvatarFallback className="rounded-lg">
              {getInitials(inv.invitedBy.name)}
            </AvatarFallback>
          </Avatar>

          <span
            className="w-40 shrink-0 truncate font-medium text-slate-text"
            title={inv.workspace.name}
          >
            {inv.workspace.name}
          </span>

          <span className="flex min-w-0 flex-1 items-center gap-2 text-muted-foreground">
            <Icon
              name={Icons.ui.building}
              size={16}
              color="currentColor"
              className="text-primary"
              aria-hidden="true"
            />
            <span className="truncate">
              {inv.invitedBy.name} invited you as {inv.role.toLowerCase()}
            </span>
          </span>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              disabled={pendingId === inv.id}
              onClick={() => onRespond(inv.id, 'decline')}
            >
              <Icon name={Icons.status.error} size={14} aria-hidden="true" />
              Decline
            </Button>
            <Button
              size="sm"
              disabled={pendingId === inv.id}
              onClick={() => onRespond(inv.id, 'accept')}
            >
              <Icon name={Icons.status.success} size={14} aria-hidden="true" />
              Accept
            </Button>
          </div>
        </div>
      ))}
    </Card>
  )
}

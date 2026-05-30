import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/Icon'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/shared/ui/empty'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Icons } from '@/lib/Icons'
import { getInitials } from '@/shared/utils/getInitials'
import type { WorkspaceInvite } from '@/shared/types'

interface InvitationsTableProps {
  invites: WorkspaceInvite[]
  pendingId: string | null
  onRespond: (id: string, action: 'accept' | 'decline') => void
}

export function InvitationsTable({ invites, pendingId, onRespond }: InvitationsTableProps) {
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
    <Table>
      <TableHeader>
        <TableRow className="not-in-data-[variant=card]:hover:bg-transparent">
          <TableHead>Workspace</TableHead>
          <TableHead>Invited by</TableHead>
          <TableHead className="w-32">Role</TableHead>
          <TableHead className="w-40 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invites.map((inv) => (
          <TableRow key={inv.id}>
            <TableCell className="text-foreground">
              <span className="flex items-center gap-2">
                <span className="truncate" title={inv.workspace.name}>
                  {inv.workspace.name}
                </span>
              </span>
            </TableCell>
            <TableCell className="text-foreground">
              <span className="flex items-center gap-2">
                <Avatar className="size-7 shrink-0 rounded-lg text-xs">
                  <AvatarFallback className="rounded-lg">
                    {getInitials(inv.invitedBy.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{inv.invitedBy.name}</span>
              </span>
            </TableCell>
            <TableCell className="text-foreground capitalize">
              {inv.role.toLowerCase()}
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-2">
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

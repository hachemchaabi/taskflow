import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { TableCell, TableRow } from '@/shared/ui/table'
import { Icon } from '@/shared/ui/Icon'
import { Icons } from '@/lib/Icons'
import type { MemberRole, WorkspaceInvite } from '@/shared/types'
import { DEFAULT_ROLE_OPTIONS } from '../constants'
import { RevokeInviteDialog } from './RevokeInviteDialog'

interface InviteRowProps {
  invite: WorkspaceInvite
  canManage: boolean
  showActions: boolean
  pending: boolean
  onUpdateRole: (inviteId: string, role: MemberRole) => void
  onRevoke: (inviteId: string) => Promise<void>
}

export function InviteRow({
  invite,
  canManage,
  showActions,
  pending,
  onUpdateRole,
  onRevoke,
}: InviteRowProps) {
  return (
    <TableRow className="bg-canvas-fog/60">
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="size-8 rounded-lg">
            <AvatarFallback className="rounded-lg bg-secondary text-muted-foreground">
              <Icon name={Icons.communication.mail} size={16} aria-hidden="true" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium leading-normal text-slate-text">{invite.email}</p>
            <p className="truncate text-sm leading-normal text-muted-foreground">
              Invited by {invite.invitedBy.name}
            </p>
          </div>
        </div>
      </TableCell>

      <TableCell>
        {canManage ? (
          <Select
            value={invite.role}
            onValueChange={(value) => onUpdateRole(invite.id, value as MemberRole)}
            disabled={pending}
          >
            <SelectTrigger aria-label={`Role for ${invite.email}`}>
              <SelectValue>
                {(value) => DEFAULT_ROLE_OPTIONS.find((o) => o.value === value)?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_ROLE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge className="capitalize">{invite.role.toLowerCase()}</Badge>
        )}
      </TableCell>

      <TableCell>
        <Badge variant="warning">Pending</Badge>
      </TableCell>

      {showActions && (
        <TableCell className="text-right">
          {canManage && (
            <RevokeInviteDialog
              invite={invite}
              onConfirm={() => onRevoke(invite.id)}
              disabled={pending}
            />
          )}
        </TableCell>
      )}
    </TableRow>
  )
}

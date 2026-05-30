import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import type { MemberRole, WorkspaceInvite, WorkspaceMember } from '@/shared/types'
import { getInitials } from '@/shared/utils/getInitials'
import { DEFAULT_ROLE_OPTIONS } from '../constants'
import { formatJoinedDate } from '../utils'
import { useMemberActions } from '../hooks/useMemberActions'
import { useInviteActions } from '../hooks/useInviteActions'
import { RemoveMemberDialog } from './RemoveMemberDialog'
import { InviteRow } from './InviteRow'

interface MembersTableProps {
  workspaceId: string
  members: WorkspaceMember[]
  invites?: WorkspaceInvite[]
  canManage: boolean
  canManageInvites?: boolean
  currentUserId?: string
  onChanged: () => void
  onInvitesChanged?: () => void
}

export function MembersTable({
  workspaceId,
  members,
  invites = [],
  canManage,
  canManageInvites = false,
  currentUserId,
  onChanged,
  onInvitesChanged,
}: MembersTableProps) {
  const { updateRole, removeMember, pendingUserId } = useMemberActions(workspaceId, onChanged)
  const inviteActions = useInviteActions(workspaceId, onInvitesChanged ?? (() => {}))

  const showActions = canManage || (canManageInvites && invites.length > 0)

  return (
    <Table>
      <TableHeader>
        <TableRow className="not-in-data-[variant=card]:hover:bg-transparent">
          <TableHead>Member</TableHead>
          <TableHead className="w-40">Role</TableHead>
          <TableHead className="w-40">Joined</TableHead>
          {showActions && <TableHead className="w-16 text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((m) => {
          const isOwner = m.role === 'OWNER'
          const isSelf = m.userId === currentUserId
          const pending = pendingUserId === m.userId
          const editable = canManage && !isOwner && !isSelf

          return (
            <TableRow key={m.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="size-8 rounded-lg">
                    {m.user.avatarUrl && <AvatarImage src={m.user.avatarUrl} alt="" />}
                    <AvatarFallback className="rounded-lg text-xs">
                      {getInitials(m.user.name, m.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium leading-normal text-slate-text">
                      {m.user.name}
                    </p>
                    <p className="truncate text-sm leading-normal text-muted-foreground">
                      {m.user.email}
                    </p>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                {editable ? (
                  <Select
                    value={m.role}
                    onValueChange={(value) => void updateRole(m.userId, value as MemberRole)}
                    disabled={pending}
                  >
                    <SelectTrigger aria-label={`Role for ${m.user.name}`}>
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
                ) : isOwner ? (
                  <Badge>Owner</Badge>
                ) : (
                  <Badge className="capitalize">{m.role.toLowerCase()}</Badge>
                )}
              </TableCell>

              <TableCell className="text-muted-foreground">
                {formatJoinedDate(m.createdAt)}
              </TableCell>

              {showActions && (
                <TableCell className="text-right">
                  {canManage && !isOwner && !isSelf && (
                    <RemoveMemberDialog
                      member={m}
                      onConfirm={() => removeMember(m.userId)}
                      disabled={pending}
                    />
                  )}
                </TableCell>
              )}
            </TableRow>
          )
        })}

        {invites.map((inv) => (
          <InviteRow
            key={inv.id}
            invite={inv}
            canManage={canManageInvites}
            showActions={showActions}
            pending={inviteActions.pendingInviteId === inv.id}
            onUpdateRole={(id, role) => void inviteActions.updateRole(id, role)}
            onRevoke={inviteActions.revokeInvite}
          />
        ))}
      </TableBody>
    </Table>
  )
}

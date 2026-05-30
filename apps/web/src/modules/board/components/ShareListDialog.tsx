import { Icons } from '@/lib/Icons'
import type { BoardMember, BoardSummary, MemberRole, WorkspaceMember } from '@/shared/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Icon } from '@/shared/ui/Icon'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Spinner } from '@/shared/ui/spinner'
import { getInitials } from '@/shared/utils/getInitials'
import { BOARD_ROLE_OPTIONS, SHARE_DIALOG } from '../constants'
import { useBoardSharing } from '../hooks/useBoardSharing'
import { Badge } from '@/shared/ui/badge'

interface Props {
  board: BoardSummary
  open: boolean
  onOpenChange: (open: boolean) => void
}

function MemberIdentity({ user }: { user: BoardMember['user'] }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-8 rounded-lg">
        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}

        <AvatarFallback className="rounded-lg text-xs">
          {getInitials(user.name, user.email)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{user.name}</p>
        <p className="truncate text-muted-foreground text-sm">{user.email}</p>
      </div>
    </div>
  )
}

export function ShareListDialog({ board, open, onOpenChange }: Props) {
  const sharing = useBoardSharing(board.id, open)

  const renderMember = (member: BoardMember) => {
    const isOwnerRow = member.role === 'OWNER'
    const busy = sharing.busyUserId === member.userId
    const canEditRole = sharing.isOwner && !isOwnerRow

    return (
      <li key={member.id} className="flex items-center justify-between gap-3 px-6 py-2">
        <MemberIdentity user={member.user} />

        <div className="flex shrink-0 items-center gap-2">
          {canEditRole ? (
            <Select
              value={member.role}
              onValueChange={(value) => void sharing.changeRole(member.userId, value as MemberRole)}
              disabled={busy}
            >
              <SelectTrigger size="sm" aria-label={`Role for ${member.user.name}`}>
                <SelectValue>
                  {(value) => BOARD_ROLE_OPTIONS.find((o) => o.value === value)?.label}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                {BOARD_ROLE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge className="capitalize">{member.role.toLowerCase()}</Badge>
          )}

          {sharing.canManage && !isOwnerRow && (
            <Button
              variant="destructive"
              size="icon-sm"
              loading={busy}
              onClick={() => void sharing.remove(member.userId)}
              aria-label={`Remove ${member.user.name}`}
            >
              <Icon name={Icons.actions.delete} />
            </Button>
          )}
        </div>
      </li>
    )
  }

  const renderCandidate = (candidate: WorkspaceMember) => {
    const busy = sharing.busyUserId === candidate.userId
    return (
      <li key={candidate.id} className="flex items-center justify-between gap-3 px-6 py-2">
        <MemberIdentity user={candidate.user} />
        <Button
          variant="outline"
          size="sm"
          loading={busy}
          onClick={() => void sharing.add(candidate.userId)}
        >
          <Icon name={Icons.user.add} />
          Add
        </Button>
      </li>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{SHARE_DIALOG.title}</DialogTitle>
          <DialogDescription>{SHARE_DIALOG.description}</DialogDescription>
        </DialogHeader>

        <DialogPanel>
          {sharing.loading ? (
            <div className="flex justify-center py-8">
              <Spinner variant="accent" className="size-6" />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <section>
                <h3 className="mb-2 font-medium text-foreground text-sm">
                  {SHARE_DIALOG.membersHeading}
                </h3>

                <ul className="-mx-6 divide-y divide-border">
                  {sharing.members.map(renderMember)}
                </ul>
              </section>

              {sharing.canManage && (
                <section>
                  <h3 className="mb-2 font-medium text-foreground text-sm">
                    {SHARE_DIALOG.addHeading}
                  </h3>

                  {sharing.candidates.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{SHARE_DIALOG.empty}</p>
                  ) : (
                    <ul className="-mx-6 divide-y divide-border">
                      {sharing.candidates.map(renderCandidate)}
                    </ul>
                  )}
                </section>
              )}
            </div>
          )}
        </DialogPanel>
      </DialogContent>
    </Dialog>
  )
}

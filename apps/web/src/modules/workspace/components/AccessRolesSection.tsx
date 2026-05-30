import { Card } from '@/shared/ui/card'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Loading } from '@/shared/components/Loading'
import { useFetch } from '@/shared/hooks/useFetch'
import type { WorkspaceSummary } from '@/shared/types'
import { Icons } from '@/lib/Icons'
import { getInitials } from '@/shared/utils/getInitials'
import { useInstantSettings } from '../hooks/useInstantSettings'
import { TransferOwnershipDialog } from './TransferOwnershipDialog'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { workspacesApi } from '../data/workspaceApi'
import { DEFAULT_ROLE_OPTIONS } from '../constants'

interface AccessRolesSectionProps {
  workspace: WorkspaceSummary
  canManage: boolean
}

export function AccessRolesSection({ workspace, canManage }: AccessRolesSectionProps) {
  const { saving, update } = useInstantSettings(workspace.id)
  const detail = useFetch((signal) => workspacesApi.get(workspace.id, signal), [workspace.id], {
    cacheKey: `workspace:${workspace.id}`,
  })
  const owner = detail.data?.members.find((m) => m.role === 'OWNER')
  const transferCandidates = detail.data?.members.filter((m) => m.role !== 'OWNER') ?? []
  const isOwner = workspace.role === 'OWNER'
  const disabled = !canManage || saving

  return (
    <Card className="space-y-6 p-6">
      <SectionHeader
        icon={Icons.ui.shield}
        title="Access & roles"
        description="Who owns this workspace and how new members join."
      />

      <div className="grid gap-2">
        <Label>Owner</Label>
        {detail.loading ? (
          <Loading label="Loading owner…" />
        ) : owner ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="size-9 rounded-lg">
                {owner.user.avatarUrl && <AvatarImage src={owner.user.avatarUrl} alt="" />}
                <AvatarFallback className="rounded-lg text-xs">
                  {getInitials(owner.user.name, owner.user.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-slate-text">{owner.user.name}</p>
                <p className="text-xs text-muted-foreground">{owner.user.email}</p>
              </div>
            </div>
            {isOwner && (
              <TransferOwnershipDialog
                workspaceId={workspace.id}
                candidates={transferCandidates}
                onTransferred={detail.refetch}
              />
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">-</p>
        )}
      </div>

      <div className="grid max-w-xs gap-2">
        <Label htmlFor="ws-default-role">Default member role</Label>
        <Select
          value={workspace.defaultMemberRole === 'ADMIN' ? 'ADMIN' : 'MEMBER'}
          onValueChange={(value) => void update({ defaultMemberRole: value as 'ADMIN' | 'MEMBER' })}
          disabled={disabled}
        >
          <SelectTrigger id="ws-default-role">
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
        <p className="text-xs text-muted-foreground">New members are assigned this role.</p>
      </div>
    </Card>
  )
}

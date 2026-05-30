import { Card } from '@/shared/ui/card'
import { Loading } from '@/shared/components/Loading'
import { useFetch } from '@/shared/hooks/useFetch'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { useWorkspace } from '../hooks/useWorkspace'
import { workspacesApi } from '../data/workspaceApi'
import { InviteMemberForm } from '../components/InviteMemberForm'
import { MembersTable } from '../components/MembersTable'

export default function MembersSettingsPage() {
  const { activeWorkspace } = useWorkspace()
  const { user } = useAuth()

  const detail = useFetch(
    (signal) => workspacesApi.get(activeWorkspace!.id, signal),
    [activeWorkspace?.id],
    { enabled: !!activeWorkspace, cacheKey: `workspace:${activeWorkspace?.id}` },
  )
  const invites = useFetch(
    (signal) => workspacesApi.listInvites(activeWorkspace!.id, signal),
    [activeWorkspace?.id],
    {
      enabled:
        !!activeWorkspace && (activeWorkspace.role === 'OWNER' || activeWorkspace.role === 'ADMIN'),
      cacheKey: `workspace-invites:${activeWorkspace?.id}`,
    },
  )

  if (!activeWorkspace) return <p className="text-muted-foreground">Select a workspace first.</p>
  if (detail.loading) return <Loading label="Loading members…" />

  const canManage = activeWorkspace.role === 'OWNER' || activeWorkspace.role === 'ADMIN'
  const isOwner = activeWorkspace.role === 'OWNER'

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-sm text-muted-foreground">{activeWorkspace.name}</p>
        </div>
        {canManage && (
          <InviteMemberForm workspaceId={activeWorkspace.id} onInvited={() => invites.refetch()} />
        )}
      </header>

      <Card className="overflow-hidden p-0">
        <MembersTable
          workspaceId={activeWorkspace.id}
          members={detail.data?.members ?? []}
          invites={invites.data ?? []}
          canManage={isOwner}
          canManageInvites={canManage}
          currentUserId={user?.id}
          onChanged={detail.refetch}
          onInvitesChanged={invites.refetch}
        />
      </Card>
    </section>
  )
}

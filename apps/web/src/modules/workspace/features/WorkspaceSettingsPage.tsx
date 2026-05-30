import { Card } from '@/shared/ui/card'
import { Icons } from '@/lib/Icons'
import { useWorkspace } from '../hooks/useWorkspace'
import { GeneralSection } from '../components/GeneralSection'
import { AccessRolesSection } from '../components/AccessRolesSection'
import { DeleteWorkspaceDialog } from '../components/DeleteWorkspaceDialog'
import { SectionHeader } from '@/shared/components/SectionHeader'

export default function WorkspaceSettingsPage() {
  const { activeWorkspace } = useWorkspace()

  const canManage = activeWorkspace?.role === 'OWNER' || activeWorkspace?.role === 'ADMIN'
  const isOwner = activeWorkspace?.role === 'OWNER'

  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold text-slate-text">Workspace settings</h1>
        <p className="text-sm text-muted-foreground">Manage this workspace’s details and access.</p>
      </header>

      {activeWorkspace && (
        <>
          <GeneralSection workspace={activeWorkspace} canManage={canManage} />
          <AccessRolesSection workspace={activeWorkspace} canManage={canManage} />
        </>
      )}

      {activeWorkspace && isOwner && (
        <Card className="space-y-4 border-destructive p-6">
          <SectionHeader
            tone="danger"
            icon={Icons.status.warning}
            title="Danger zone"
            description="Deleting a workspace removes its boards and memberships. This cannot be undone."
          />

          <div className="flex justify-end">
            <DeleteWorkspaceDialog workspace={activeWorkspace} />
          </div>
        </Card>
      )}
    </section>
  )
}

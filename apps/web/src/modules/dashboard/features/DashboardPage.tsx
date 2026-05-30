import { Card } from '@/shared/ui/card'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { Icon } from '@/shared/ui/Icon'
import { Icons } from '@/lib/Icons'
import { useMyInvites } from '@/modules/workspace/hooks/useMyInvites'
import { GreetingHeader } from '../components/GreetingHeader'
import { InvitationsTable } from '../components/InvitationsTable'
import { MyTasksTable } from '../components/MyTasksTable'
import { RecentActivity } from '../components/RecentActivity'
import { useMyTasks } from '../hooks/useMyTasks'
import { useWorkspaceActivity } from '../hooks/useWorkspaceActivity'

export default function DashboardPage() {
  const { invites, pendingId, respond } = useMyInvites()
  const { tasks, loading: tasksLoading } = useMyTasks()
  const { activities, loading: activityLoading } = useWorkspaceActivity()
  const pendingInvites = invites ?? []

  return (
    <section className="space-y-8">
      <GreetingHeader />

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon
            name={Icons.navigation.inbox}
            size={16}
            color="currentColor"
            className="text-primary"
            aria-hidden="true"
          />
          Pending invitations
        </h2>
        <Card className="overflow-hidden p-0">
          <InvitationsTable invites={pendingInvites} pendingId={pendingId} onRespond={respond} />
        </Card>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="space-y-3 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Icon
              name={Icons.navigation.board}
              size={16}
              color="currentColor"
              className="text-primary"
              aria-hidden="true"
            />
            My tasks
          </h2>
          <Card className="overflow-hidden p-0">
            <MyTasksTable tasks={tasks} loading={tasksLoading} />
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Icon
              name={Icons.ui.clock}
              size={16}
              color="currentColor"
              className="text-primary"
              aria-hidden="true"
            />
            Recent activity
          </h2>
          <Card className="h-[28rem]">
            <ScrollArea scrollFade scrollbarGutter className="min-h-0 flex-1">
              <RecentActivity activities={activities} loading={activityLoading} />
            </ScrollArea>
          </Card>
        </section>
      </div>
    </section>
  )
}

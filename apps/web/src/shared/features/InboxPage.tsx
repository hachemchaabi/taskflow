import { useSearchParams } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Icon } from '@/shared/ui/Icon'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/shared/ui/empty'
import { Tabs, TabsList, TabsTab, TabsPanel } from '@/shared/ui/tabs'
import { Icons } from '@/lib/Icons'
import { Loading } from '@/shared/components/Loading'
import { InvitationsList } from '@/shared/components/InvitationsList'
import { useMyInvites } from '@/modules/workspace/hooks/useMyInvites'
import { useNotifications } from '@/modules/notification/hooks/useNotifications'
import { NotificationList } from '@/modules/notification/components/NotificationList'

export default function InboxPage() {
  const { invites, loading: invitesLoading, pendingId, respond } = useMyInvites()
  const { items, status, unreadCount, markAllRead, clearAll } = useNotifications()
  const [searchParams, setSearchParams] = useSearchParams()

  const inviteCount = invites?.length ?? 0
  const hasNotifications = items.length > 0
  const loading = (invitesLoading && !invites) || (status === 'loading' && !hasNotifications)

  if (loading) return <Loading label="Loading your inbox…" />

  const tabParam = searchParams.get('tab')
  const defaultTab = !hasNotifications && inviteCount > 0 ? 'invites' : 'notifications'
  const activeTab = tabParam === 'invites' || tabParam === 'notifications' ? tabParam : defaultTab

  const handleTabChange = (value: string | null) => {
    if (!value) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', value)
        return next
      },
      { replace: true },
    )
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold text-slate-text">Inbox</h1>
        <p className="text-sm text-muted-foreground">Workspace invites and recent notifications.</p>
      </header>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-4">
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTab value="notifications">
              <Icon name={Icons.communication.notification} aria-hidden="true" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" size="sm">
                  {unreadCount}
                </Badge>
              )}
            </TabsTab>
            <TabsTab value="invites">
              <Icon name={Icons.navigation.inbox} aria-hidden="true" />
              Invites
              {inviteCount > 0 && (
                <Badge variant="secondary" size="sm">
                  {inviteCount}
                </Badge>
              )}
            </TabsTab>
          </TabsList>

          {activeTab === 'notifications' && hasNotifications && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={unreadCount === 0}
                onClick={() => void markAllRead()}
              >
                <Icon name={Icons.actions.save} aria-hidden="true" />
                Mark all as read
              </Button>
              <Button variant="destructive" size="sm" onClick={() => void clearAll()}>
                <Icon name={Icons.actions.delete} aria-hidden="true" />
                Clear all
              </Button>
            </div>
          )}
        </div>

        <TabsPanel value="notifications" className="space-y-3">
          {hasNotifications ? (
            <NotificationList />
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Icon name={Icons.communication.notification} aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>You&rsquo;re all caught up</EmptyTitle>
                <EmptyDescription>
                  No notifications right now. We&rsquo;ll let you know when something needs your
                  attention.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </TabsPanel>

        <TabsPanel value="invites">
          <InvitationsList invites={invites ?? []} pendingId={pendingId} onRespond={respond} />
        </TabsPanel>
      </Tabs>
    </section>
  )
}

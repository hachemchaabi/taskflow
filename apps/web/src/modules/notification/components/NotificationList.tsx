import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/shared/ui/card'
import { useNotifications } from '../hooks/useNotifications'
import { sectionNotifications, notificationLink } from '../utils'
import type { AppNotification } from '../data/types'
import { NotificationRow } from './NotificationRow'

export function NotificationList() {
  const { items, markRead, clear } = useNotifications()
  const navigate = useNavigate()
  const now = useMemo(() => new Date(), [])
  const sections = useMemo(() => sectionNotifications(items, now), [items, now])

  const openNotification = (n: AppNotification) => {
    if (n.readAt === null) void markRead(n.id)
    const link = notificationLink(n)
    if (link) navigate(link)
  }

  const markNotificationRead = (n: AppNotification) => {
    if (n.readAt === null) void markRead(n.id)
  }

  const clearNotification = (n: AppNotification) => void clear(n.id)

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <section key={section.key} className="space-y-2">
          <h3 className="px-1 text-sm font-medium text-muted-foreground">{section.label}</h3>
          <Card className="divide-y divide-stone-border overflow-hidden p-0">
            {section.items.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                now={now}
                interactive={notificationLink(n) !== null}
                onOpen={openNotification}
                onMarkRead={markNotificationRead}
                onClear={clearNotification}
              />
            ))}
          </Card>
        </section>
      ))}
    </div>
  )
}

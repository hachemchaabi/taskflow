import type { AppNotification } from './data/types'

export interface NotificationSection {
  key: string
  label: string
  items: AppNotification[]
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function periodFor(iso: string, now: Date): { key: string; label: string } {
  const d = new Date(iso)
  if (d.getFullYear() === now.getFullYear()) {
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS[d.getMonth()] }
  }
  return { key: String(d.getFullYear()), label: String(d.getFullYear()) }
}

export function formatNotificationDate(iso: string, now: Date): string {
  const d = new Date(iso)
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }
  return d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: '2-digit' })
}

export function sectionNotifications(items: AppNotification[], now: Date): NotificationSection[] {
  const sections: NotificationSection[] = []
  const byPeriod = new Map<string, NotificationSection>()

  for (const n of items) {
    const period = periodFor(n.createdAt, now)
    let section = byPeriod.get(period.key)
    if (!section) {
      section = { key: period.key, label: period.label, items: [] }
      byPeriod.set(period.key, section)
      sections.push(section)
    }
    section.items.push(n)
  }

  return sections
}

export function notificationLink(n: AppNotification): string | null {
  if (!n.workspaceActive) return null
  if (n.type === 'WORKSPACE_INVITE') return null
  if (n.boardId && n.cardId) return `/boards/${n.boardId}?card=${n.cardId}`
  if (n.boardId) return `/boards/${n.boardId}`
  return null
}

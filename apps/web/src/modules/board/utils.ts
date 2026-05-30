export type StatusKey = 'todo' | 'in-progress' | 'done'

export function matchStatus(title: string): StatusKey | null {
  const normalized = title
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, ' ')
  if (normalized === 'to do' || normalized === 'todo') return 'todo'
  if (normalized === 'in progress') return 'in-progress'
  if (normalized === 'done') return 'done'
  return null
}

export function mentionName(userId: string, name: string, currentUserId?: string): string {
  return userId === currentUserId ? 'Me' : name
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function formatTimeAgo(iso: string): string {
  const diffSec = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  if (diffSec < 45) return 'just now'
  const min = Math.round(diffSec / 60)
  if (min < 60) return rtf.format(-min, 'minute')
  const hr = Math.round(min / 60)
  if (hr < 24) return rtf.format(-hr, 'hour')
  const day = Math.round(hr / 24)
  if (day < 30) return rtf.format(-day, 'day')
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDue(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function formatDateRange(start?: string | null, end?: string | null): string | null {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  if (start && end) return `${fmt(start)} → ${fmt(end)}`
  if (end) return fmt(end)
  if (start) return fmt(start)
  return null
}

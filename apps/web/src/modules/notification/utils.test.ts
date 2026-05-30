import { describe, it, expect } from 'vitest'
import { formatNotificationDate, sectionNotifications, notificationLink, periodFor } from './utils'
import type { AppNotification } from './data/types'

const NOW = new Date('2026-04-30T12:00:00.000Z')

const notif = (overrides: Partial<AppNotification> = {}): AppNotification => ({
  id: Math.random().toString(36).slice(2),
  type: 'CARD_ASSIGNED',
  workspaceId: 'w1',
  boardId: 'b1',
  cardId: 'c1',
  data: { title: 'Card', message: 'assigned you' },
  readAt: null,
  createdAt: '2026-04-22T10:00:00.000Z',
  actor: { id: 'u2', name: 'Alice', avatarUrl: null },
  workspaceActive: true,
  ...overrides,
})

describe('periodFor', () => {
  it('labels current-year dates by month name', () => {
    expect(periodFor('2026-04-22T10:00:00Z', NOW).label).toBe('April')
    expect(periodFor('2026-01-15T10:00:00Z', NOW).label).toBe('January')
  })

  it('labels prior-year dates by the year', () => {
    expect(periodFor('2025-12-03T10:00:00Z', NOW).label).toBe('2025')
  })
})

describe('formatNotificationDate', () => {
  it('uses month/day in the current year and includes the year for older dates', () => {
    expect(formatNotificationDate('2026-04-22T10:00:00Z', NOW)).toMatch(/Apr/)
    expect(formatNotificationDate('2025-12-03T10:00:00Z', NOW)).toMatch(/25/)
  })
})

describe('sectionNotifications', () => {
  it('splits notifications into time-period sections, newest period first', () => {
    const sections = sectionNotifications(
      [
        notif({ id: 'a', cardId: 'c1', createdAt: '2026-04-22T10:00:00Z' }),
        notif({ id: 'b', cardId: 'c1', createdAt: '2026-04-21T10:00:00Z' }),
        notif({ id: 'c', cardId: 'c2', createdAt: '2026-01-10T10:00:00Z' }),
      ],
      NOW,
    )
    expect(sections.map((s) => s.label)).toEqual(['April', 'January'])
    expect(sections[0].items.map((n) => n.id)).toEqual(['a', 'b'])
    expect(sections[1].items.map((n) => n.id)).toEqual(['c'])
  })

  it('keeps every notification as its own row, even for the same card', () => {
    const [section] = sectionNotifications(
      [notif({ id: 'a', cardId: 'c1' }), notif({ id: 'b', cardId: 'c1' })],
      NOW,
    )
    expect(section.items).toHaveLength(2)
  })
})

describe('notificationLink', () => {
  it('links a card notification to its board with the card param', () => {
    expect(notificationLink(notif({ boardId: 'b9', cardId: 'c9' }))).toBe('/boards/b9?card=c9')
  })

  it('returns null when the workspace is no longer available', () => {
    expect(notificationLink(notif({ workspaceActive: false }))).toBeNull()
  })

  it('returns null for invites (handled in the Invites section)', () => {
    expect(notificationLink(notif({ type: 'WORKSPACE_INVITE', cardId: null }))).toBeNull()
  })
})

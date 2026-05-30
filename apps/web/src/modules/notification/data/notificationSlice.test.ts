import { describe, it, expect } from 'vitest'
import { initialNotificationState, notificationReducer, unreadCount } from './notificationSlice'
import type { AppNotification } from './types'

const notif = (id: string, overrides: Partial<AppNotification> = {}): AppNotification => ({
  id,
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

describe('notificationReducer', () => {
  it('LOADED replaces items and marks ready', () => {
    const next = notificationReducer(initialNotificationState, {
      type: 'LOADED',
      items: [notif('a'), notif('b')],
    })
    expect(next.status).toBe('ready')
    expect(next.items).toHaveLength(2)
  })

  it('RECEIVED prepends a new notification', () => {
    const base = notificationReducer(initialNotificationState, {
      type: 'LOADED',
      items: [notif('a')],
    })
    const next = notificationReducer(base, { type: 'RECEIVED', item: notif('b') })
    expect(next.items.map((n) => n.id)).toEqual(['b', 'a'])
  })

  it('RECEIVED ignores duplicates', () => {
    const base = notificationReducer(initialNotificationState, {
      type: 'LOADED',
      items: [notif('a')],
    })
    const next = notificationReducer(base, { type: 'RECEIVED', item: notif('a') })
    expect(next.items).toHaveLength(1)
  })

  it('MARK_READ stamps readAt on the matching unread item', () => {
    const base = notificationReducer(initialNotificationState, {
      type: 'LOADED',
      items: [notif('a'), notif('b')],
    })
    const next = notificationReducer(base, { type: 'MARK_READ', id: 'a', readAt: 'now' })
    expect(next.items.find((n) => n.id === 'a')?.readAt).toBe('now')
    expect(next.items.find((n) => n.id === 'b')?.readAt).toBeNull()
  })

  it('MARK_ALL_READ stamps every unread item', () => {
    const base = notificationReducer(initialNotificationState, {
      type: 'LOADED',
      items: [notif('a'), notif('b', { readAt: 'earlier' })],
    })
    const next = notificationReducer(base, { type: 'MARK_ALL_READ', readAt: 'now' })
    expect(next.items.find((n) => n.id === 'a')?.readAt).toBe('now')
    expect(next.items.find((n) => n.id === 'b')?.readAt).toBe('earlier')
  })

  it('REMOVED drops the item; CLEARED empties the list', () => {
    const base = notificationReducer(initialNotificationState, {
      type: 'LOADED',
      items: [notif('a'), notif('b')],
    })
    expect(notificationReducer(base, { type: 'REMOVED', id: 'a' }).items).toHaveLength(1)
    expect(notificationReducer(base, { type: 'CLEARED' }).items).toHaveLength(0)
  })
})

describe('unreadCount', () => {
  it('counts only items without readAt', () => {
    expect(unreadCount([notif('a'), notif('b', { readAt: 'x' }), notif('c')])).toBe(2)
  })
})

import { describe, expect, it } from 'vitest'
import { initialRealtimeState, realtimeReducer, type RealtimeState } from './realtimeSlice'
import type { PresenceUser } from './realtimeEvents'

const present = (id: string, name: string): PresenceUser => ({
  id,
  name,
  avatarUrl: null,
  context: { type: 'board', editing: false },
})

describe('realtimeReducer', () => {
  it('marks the connection as connected', () => {
    const next = realtimeReducer(initialRealtimeState, { type: 'CONNECTED' })
    expect(next.connected).toBe(true)
  })

  it('clears all transient state on disconnect', () => {
    const dirty: RealtimeState = {
      connected: true,
      presenceByBoard: { b1: [present('u1', 'Al')] },
      typingByCard: { c1: [{ id: 'u1', name: 'Al' }] },
    }
    expect(realtimeReducer(dirty, { type: 'DISCONNECTED' })).toEqual(initialRealtimeState)
  })

  it('stores a presence list per board without touching others', () => {
    const withB1 = realtimeReducer(initialRealtimeState, {
      type: 'PRESENCE_SET',
      boardId: 'b1',
      users: [present('u1', 'Al')],
    })
    const withB2 = realtimeReducer(withB1, {
      type: 'PRESENCE_SET',
      boardId: 'b2',
      users: [present('u2', 'Bo')],
    })
    expect(withB2.presenceByBoard.b1).toHaveLength(1)
    expect(withB2.presenceByBoard.b2[0].id).toBe('u2')
  })

  it('replaces a board presence list on a new snapshot', () => {
    const first = realtimeReducer(initialRealtimeState, {
      type: 'PRESENCE_SET',
      boardId: 'b1',
      users: [present('u1', 'Al'), present('u2', 'Bo')],
    })
    const second = realtimeReducer(first, {
      type: 'PRESENCE_SET',
      boardId: 'b1',
      users: [present('u1', 'Al')],
    })
    expect(second.presenceByBoard.b1).toHaveLength(1)
  })

  it('sets typing users for a card', () => {
    const next = realtimeReducer(initialRealtimeState, {
      type: 'TYPING_SET',
      cardId: 'c1',
      users: [{ id: 'u1', name: 'Al' }],
    })
    expect(next.typingByCard.c1).toEqual([{ id: 'u1', name: 'Al' }])
  })

  it('removes the card entry when the typing list goes empty', () => {
    const withTyping = realtimeReducer(initialRealtimeState, {
      type: 'TYPING_SET',
      cardId: 'c1',
      users: [{ id: 'u1', name: 'Al' }],
    })
    const cleared = realtimeReducer(withTyping, { type: 'TYPING_SET', cardId: 'c1', users: [] })
    expect(cleared.typingByCard.c1).toBeUndefined()
  })

  it('resets to the initial state', () => {
    const dirty = realtimeReducer(initialRealtimeState, { type: 'CONNECTED' })
    expect(realtimeReducer(dirty, { type: 'RESET' })).toEqual(initialRealtimeState)
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import * as registry from './presence.registry.js'

const alice = { id: 'u-alice', name: 'Alice', avatarUrl: null }
const bob = { id: 'u-bob', name: 'Bob', avatarUrl: 'https://img/bob.png' }

beforeEach(() => registry.reset())

describe('presence registry', () => {
  it('starts empty', () => {
    expect(registry.list('b1')).toEqual([])
  })

  it('adds a user with the default board context on join', () => {
    const list = registry.join('b1', 's1', alice)
    expect(list).toEqual([
      { id: 'u-alice', name: 'Alice', avatarUrl: null, context: { type: 'board', editing: false } },
    ])
  })

  it('lists multiple distinct users on a board', () => {
    registry.join('b1', 's1', alice)
    const list = registry.join('b1', 's2', bob)
    expect(list.map((u) => u.id).sort()).toEqual(['u-alice', 'u-bob'])
  })

  it('returns presence in a stable id order regardless of join order', () => {
    registry.join('b1', 's1', bob)
    const list = registry.join('b1', 's2', alice)
    expect(list.map((u) => u.id)).toEqual(['u-alice', 'u-bob'])
  })

  it('keeps a single presence entry when one user opens several sockets', () => {
    registry.join('b1', 's1', alice)
    registry.join('b1', 's2', alice)
    expect(registry.list('b1')).toHaveLength(1)
  })

  it('keeps the user present until their last socket leaves', () => {
    registry.join('b1', 's1', alice)
    registry.join('b1', 's2', alice)
    expect(registry.leave('b1', 's1')).toHaveLength(1)
    expect(registry.leave('b1', 's2')).toHaveLength(0)
  })

  it('updates a user context and reflects it in the list', () => {
    registry.join('b1', 's1', alice)
    const list = registry.setContext('b1', 'u-alice', {
      type: 'card',
      cardId: 'c9',
      cardTitle: 'Fix login bug',
      editing: true,
    })
    expect(list[0].context).toEqual({
      type: 'card',
      cardId: 'c9',
      cardTitle: 'Fix login bug',
      editing: true,
    })
  })

  it('ignores setContext for an unknown board/user', () => {
    expect(registry.setContext('nope', 'ghost', { type: 'board', editing: false })).toEqual([])
  })

  it('removes a socket from every board on disconnect', () => {
    registry.join('b1', 's1', alice)
    registry.join('b2', 's1', alice)
    registry.join('b2', 's2', bob)
    const affected = registry.leaveAllForSocket('s1')
    expect(affected.map((a) => a.boardId).sort()).toEqual(['b1', 'b2'])
    expect(registry.list('b1')).toHaveLength(0)
    expect(registry.list('b2').map((u) => u.id)).toEqual(['u-bob'])
  })

  it('refreshes identity (name/avatar) on a subsequent join', () => {
    registry.join('b1', 's1', alice)
    const list = registry.join('b1', 's2', { ...alice, name: 'Alice B.' })
    expect(list[0].name).toBe('Alice B.')
  })
})

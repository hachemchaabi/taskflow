import { describe, it, expect } from 'vitest'
import { collectMyTasks, sortByPriority, type MyTask } from './useMyTasks'
import type { BoardDetail, Card, Priority } from '@/shared/types'

const ME = 'me'

function card(over: Partial<Card> & { id: string }): Card {
  return {
    title: over.id,
    position: 0,
    priority: 'NONE',
    description: null,
    startDate: null,
    endDate: null,
    assignees: [],
    labels: [],
    ...over,
  } as Card
}

function board(id: string, cards: Card[]): BoardDetail {
  return {
    id,
    title: `Board ${id}`,
    lists: [{ id: `${id}-list`, title: 'To Do', position: 0, cards }],
  } as unknown as BoardDetail
}

describe('collectMyTasks', () => {
  it('keeps only cards assigned to the user and tags board/list', () => {
    const mine = card({ id: 'a', assignees: [{ id: ME, name: 'Me', avatarUrl: null }] })
    const theirs = card({ id: 'b', assignees: [{ id: 'other', name: 'Other', avatarUrl: null }] })
    const result = collectMyTasks([board('b1', [mine, theirs])], ME)

    expect(result.map((t) => t.id)).toEqual(['a'])
    expect(result[0]).toMatchObject({ boardId: 'b1', boardTitle: 'Board b1', listId: 'b1-list' })
  })

  it('aggregates across multiple boards', () => {
    const mk = (id: string) => card({ id, assignees: [{ id: ME, name: 'Me', avatarUrl: null }] })
    const result = collectMyTasks([board('b1', [mk('a')]), board('b2', [mk('c')])], ME)
    expect(result.map((t) => t.id).sort()).toEqual(['a', 'c'])
  })
})

describe('sortByPriority', () => {
  const task = (id: string, priority: Priority, endDate: string | null): MyTask =>
    ({ ...card({ id, priority, endDate }), boardId: 'b', boardTitle: 'B', listId: 'l' }) as MyTask

  it('orders HIGH → MEDIUM → LOW → NONE', () => {
    const sorted = sortByPriority([
      task('none', 'NONE', null),
      task('low', 'LOW', null),
      task('high', 'HIGH', null),
      task('medium', 'MEDIUM', null),
    ])
    expect(sorted.map((t) => t.id)).toEqual(['high', 'medium', 'low', 'none'])
  })

  it('breaks ties by soonest due date, undated last', () => {
    const sorted = sortByPriority([
      task('later', 'HIGH', '2026-06-10T00:00:00.000Z'),
      task('undated', 'HIGH', null),
      task('sooner', 'HIGH', '2026-06-01T00:00:00.000Z'),
    ])
    expect(sorted.map((t) => t.id)).toEqual(['sooner', 'later', 'undated'])
  })
})

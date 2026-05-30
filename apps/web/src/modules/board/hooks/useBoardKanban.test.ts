import { renderHook, act, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { BoardDetail } from '@/shared/types'
import { notifyError } from '@/shared/utils/notify'
import { cardApi } from '../data/cardApi'
import { useBoardKanban } from './useBoardKanban'

vi.mock('../data/cardApi', () => ({
  cardApi: { create: vi.fn(), get: vi.fn(), update: vi.fn(), addComment: vi.fn() },
}))
vi.mock('@/shared/utils/notify', () => ({ notifyError: vi.fn(), notifySuccess: vi.fn() }))

const card = (id: string, position: number) => ({
  id,
  title: id,
  description: null,
  position,
  priority: 'NONE' as const,
  startDate: null,
  endDate: null,
  assignees: [],
  labels: [],
})

const board: BoardDetail = {
  id: 'b1',
  title: 'Board',
  owner: { id: 'u1', name: 'U', email: 'u@x.io' },
  role: 'OWNER',
  labels: [],
  members: [],
  lists: [
    { id: 'todo', title: 'To Do', position: 0, cards: [card('c1', 0)] },
    { id: 'done', title: 'Done', position: 1, cards: [] },
  ],
}

const start = (id: string) => ({ active: { id } }) as unknown as DragStartEvent
const end = (id: string) => ({ active: { id }, over: { id } }) as unknown as DragEndEvent

describe('useBoardKanban', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps lists into columns and items sorted by position', () => {
    const { result } = renderHook(() => useBoardKanban(board))
    expect(result.current.columns.map((c) => c.id)).toEqual(['todo', 'done'])
    expect(result.current.items).toHaveLength(1)
    expect(result.current.countFor('todo')).toBe(1)
    expect(result.current.countFor('done')).toBe(0)
  })

  it('persists the new list when a card is dropped in another column', async () => {
    vi.mocked(cardApi.update).mockResolvedValue({} as Awaited<ReturnType<typeof cardApi.update>>)
    const { result } = renderHook(() => useBoardKanban(board))

    act(() => result.current.onDragStart(start('c1')))
    act(() =>
      result.current.setItems((prev) =>
        prev.map((it) => (it.id === 'c1' ? { ...it, column: 'done' } : it)),
      ),
    )
    await act(async () => {
      await result.current.onDragEnd(end('c1'))
    })

    expect(cardApi.update).toHaveBeenCalledWith('c1', { listId: 'done' })
  })

  it('does not call the API for a reorder within the same column', async () => {
    const { result } = renderHook(() => useBoardKanban(board))
    act(() => result.current.onDragStart(start('c1')))
    await act(async () => {
      await result.current.onDragEnd(end('c1'))
    })
    expect(cardApi.update).not.toHaveBeenCalled()
  })

  it('exposes only cards that pass the matches predicate', () => {
    const filtered: BoardDetail = {
      ...board,
      lists: [
        {
          id: 'todo',
          title: 'To Do',
          position: 0,
          cards: [card('keep', 0), card('drop', 1)],
        },
        { id: 'done', title: 'Done', position: 1, cards: [] },
      ],
    }
    const { result } = renderHook(() => useBoardKanban(filtered, (c) => c.id === 'keep'))
    expect(result.current.items.map((it) => it.id)).toEqual(['keep'])
    expect(result.current.countFor('todo')).toBe(1)
  })

  it('keeps filtered-out cards in state when the visible set is reordered', () => {
    const filtered: BoardDetail = {
      ...board,
      lists: [
        {
          id: 'todo',
          title: 'To Do',
          position: 0,
          cards: [card('keep', 0), card('hidden', 1)],
        },
        { id: 'done', title: 'Done', position: 1, cards: [] },
      ],
    }
    const { result } = renderHook(() => useBoardKanban(filtered, (c) => c.id === 'keep'))
    act(() =>
      result.current.setItems(result.current.items.map((it) => ({ ...it, column: 'done' }))),
    )
    expect(result.current.countFor('done')).toBe(1)
  })

  it('reverts the card and notifies when the move fails', async () => {
    vi.mocked(cardApi.update).mockRejectedValue(new Error('nope'))
    const { result } = renderHook(() => useBoardKanban(board))

    act(() => result.current.onDragStart(start('c1')))
    act(() =>
      result.current.setItems((prev) =>
        prev.map((it) => (it.id === 'c1' ? { ...it, column: 'done' } : it)),
      ),
    )
    await act(async () => {
      await result.current.onDragEnd(end('c1'))
    })

    await waitFor(() =>
      expect(result.current.items.find((it) => it.id === 'c1')?.column).toBe('todo'),
    )
    expect(notifyError).toHaveBeenCalled()
  })
})

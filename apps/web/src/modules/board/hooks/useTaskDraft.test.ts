import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTaskDraft } from './useTaskDraft'
import { cardApi } from '../data/cardApi'

vi.mock('../data/cardApi', () => ({
  cardApi: { create: vi.fn(), get: vi.fn(), update: vi.fn(), addComment: vi.fn() },
  cardCacheKey: (id: string) => `card:${id}`,
}))

const baseCard = {
  id: 'c1',
  title: 'New',
  description: null,
  position: 0,
  startDate: null,
  endDate: null,
  assignees: [],
  labels: [],
  listId: 'l1',
  comments: [],
  activities: [],
}

describe('useTaskDraft', () => {
  beforeEach(() => vi.clearAllMocks())

  it('create mode: submit posts and surfaces the created card', async () => {
    void (cardApi.create as ReturnType<typeof vi.fn>).mockResolvedValue(baseCard)
    const onCreated = vi.fn()
    const { result } = renderHook(() =>
      useTaskDraft({ mode: 'create', boardId: 'b1', listId: 'l1', onCreated, onChanged: vi.fn() }),
    )
    act(() => result.current.setField('title', 'New'))
    await act(async () => {
      await result.current.submit()
    })
    expect(cardApi.create).toHaveBeenCalledWith(
      'b1',
      expect.objectContaining({ title: 'New', listId: 'l1' }),
    )
    expect(onCreated).toHaveBeenCalledWith('c1')
  })

  it('view mode: committing a field patches the card', async () => {
    void (cardApi.get as ReturnType<typeof vi.fn>).mockResolvedValue(baseCard)
    void (cardApi.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...baseCard,
      title: 'Edited',
    })
    const onChanged = vi.fn()
    const { result } = renderHook(() =>
      useTaskDraft({ mode: 'view', boardId: 'b1', cardId: 'c1', onChanged, onCreated: vi.fn() }),
    )
    await waitFor(() => expect(result.current.detail?.id).toBe('c1'))
    await act(async () => {
      await result.current.commit({ title: 'Edited' })
    })
    expect(cardApi.update).toHaveBeenCalledWith('c1', { title: 'Edited' })
    expect(onChanged).toHaveBeenCalled()
  })
})

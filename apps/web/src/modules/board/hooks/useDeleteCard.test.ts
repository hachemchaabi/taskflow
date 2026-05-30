import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('../data/cardApi', () => ({
  cardApi: { remove: vi.fn() },
  cardCacheKey: (id: string) => `card:${id}`,
}))
vi.mock('@/shared/utils/notify', () => ({ notifyError: vi.fn() }))

import { cardApi } from '../data/cardApi'
import { notifyError } from '@/shared/utils/notify'
import { useDeleteCard } from './useDeleteCard'

describe('useDeleteCard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('removes the card and notifies the caller', async () => {
    vi.mocked(cardApi.remove).mockResolvedValue(undefined as never)
    const onDeleted = vi.fn()
    const { result } = renderHook(() => useDeleteCard('c1', onDeleted))

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.remove()
    })

    expect(cardApi.remove).toHaveBeenCalledWith('c1')
    expect(onDeleted).toHaveBeenCalled()
    expect(ok).toBe(true)
  })

  it('surfaces an error and does not notify the caller on failure', async () => {
    vi.mocked(cardApi.remove).mockRejectedValue(new Error('nope'))
    const onDeleted = vi.fn()
    const { result } = renderHook(() => useDeleteCard('c1', onDeleted))

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.remove()
    })

    expect(onDeleted).not.toHaveBeenCalled()
    expect(notifyError).toHaveBeenCalled()
    expect(ok).toBe(false)
  })
})

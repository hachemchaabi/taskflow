import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('../data/boardApi', () => ({
  boardsApi: { update: vi.fn() },
}))
vi.mock('@/shared/utils/notify', () => ({ notifyError: vi.fn() }))

import { boardsApi } from '../data/boardApi'
import { useRenameBoard } from './useRenameBoard'

describe('useRenameBoard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates the board title and reports success', async () => {
    vi.mocked(boardsApi.update).mockResolvedValue({ id: 'b1', title: 'New' } as never)
    const onRenamed = vi.fn()
    const { result } = renderHook(() => useRenameBoard('b1', onRenamed))
    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.rename('New')
    })
    expect(boardsApi.update).toHaveBeenCalledWith('b1', { title: 'New' })
    expect(onRenamed).toHaveBeenCalled()
    expect(ok).toBe(true)
  })

  it('returns false and notifies on failure', async () => {
    vi.mocked(boardsApi.update).mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useRenameBoard('b1', vi.fn()))
    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.rename('New')
    })
    expect(ok).toBe(false)
  })
})

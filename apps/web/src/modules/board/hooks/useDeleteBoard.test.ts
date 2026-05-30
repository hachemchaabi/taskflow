import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const navigate = vi.fn()
let pathname = '/'
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname }),
}))
vi.mock('../data/boardApi', () => ({ boardsApi: { remove: vi.fn() } }))
vi.mock('@/shared/utils/notify', () => ({ notifyError: vi.fn() }))

import { boardsApi } from '../data/boardApi'
import { useDeleteBoard } from './useDeleteBoard'

describe('useDeleteBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pathname = '/'
  })

  it('removes the board and refreshes', async () => {
    vi.mocked(boardsApi.remove).mockResolvedValue(undefined as never)
    const onDeleted = vi.fn()
    const { result } = renderHook(() => useDeleteBoard('b1', onDeleted))
    await act(async () => {
      await result.current.remove()
    })
    expect(boardsApi.remove).toHaveBeenCalledWith('b1')
    expect(onDeleted).toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('navigates home when the deleted board is the active route', async () => {
    pathname = '/boards/b1'
    vi.mocked(boardsApi.remove).mockResolvedValue(undefined as never)
    const { result } = renderHook(() => useDeleteBoard('b1', vi.fn()))
    await act(async () => {
      await result.current.remove()
    })
    expect(navigate).toHaveBeenCalledWith('/')
  })
})

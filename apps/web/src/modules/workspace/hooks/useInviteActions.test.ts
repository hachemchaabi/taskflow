import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const updateInviteRole = vi.fn()
const revokeInvite = vi.fn()
vi.mock('../data/workspaceApi', () => ({
  workspacesApi: {
    updateInviteRole: (...args: unknown[]) => updateInviteRole(...args),
    revokeInvite: (...args: unknown[]) => revokeInvite(...args),
  },
}))

vi.mock('@/shared/utils/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}))

import { useInviteActions } from './useInviteActions'
import { notifySuccess, notifyError } from '@/shared/utils/notify'

describe('useInviteActions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates an invite role, notifies, and resyncs', async () => {
    updateInviteRole.mockResolvedValue({})
    const onChanged = vi.fn()
    const { result } = renderHook(() => useInviteActions('ws1', onChanged))

    await act(async () => {
      await result.current.updateRole('i1', 'ADMIN')
    })

    expect(updateInviteRole).toHaveBeenCalledWith('ws1', 'i1', 'ADMIN')
    expect(onChanged).toHaveBeenCalled()
    expect(notifySuccess).toHaveBeenCalled()
  })

  it('revokes an invite, notifies, and resyncs', async () => {
    revokeInvite.mockResolvedValue(undefined)
    const onChanged = vi.fn()
    const { result } = renderHook(() => useInviteActions('ws1', onChanged))

    await act(async () => {
      await result.current.revokeInvite('i1')
    })

    expect(revokeInvite).toHaveBeenCalledWith('ws1', 'i1')
    expect(onChanged).toHaveBeenCalled()
    expect(notifySuccess).toHaveBeenCalled()
  })

  it('notifies on error without resyncing', async () => {
    revokeInvite.mockRejectedValue(new Error('nope'))
    const onChanged = vi.fn()
    const { result } = renderHook(() => useInviteActions('ws1', onChanged))

    await act(async () => {
      await result.current.revokeInvite('i1')
    })

    expect(onChanged).not.toHaveBeenCalled()
    expect(notifyError).toHaveBeenCalled()
  })
})

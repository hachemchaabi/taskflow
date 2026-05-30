import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const updateMemberRole = vi.fn()
const removeMember = vi.fn()
vi.mock('../data/workspaceApi', () => ({
  workspacesApi: {
    updateMemberRole: (...args: unknown[]) => updateMemberRole(...args),
    removeMember: (...args: unknown[]) => removeMember(...args),
  },
}))

const notifySuccess = vi.fn()
const notifyError = vi.fn()
vi.mock('@/shared/utils/notify', () => ({
  notifySuccess: (...args: unknown[]) => notifySuccess(...args),
  notifyError: (...args: unknown[]) => notifyError(...args),
}))

import { useMemberActions } from './useMemberActions'

describe('useMemberActions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates a role, refetches, and toasts success', async () => {
    updateMemberRole.mockResolvedValue({})
    const onChanged = vi.fn()
    const { result } = renderHook(() => useMemberActions('ws1', onChanged))

    await act(() => result.current.updateRole('u2', 'ADMIN'))

    expect(updateMemberRole).toHaveBeenCalledWith('ws1', 'u2', 'ADMIN')
    expect(onChanged).toHaveBeenCalledOnce()
    expect(notifySuccess).toHaveBeenCalled()
    expect(result.current.pendingUserId).toBeNull()
  })

  it('removes a member, refetches, and toasts success', async () => {
    removeMember.mockResolvedValue(undefined)
    const onChanged = vi.fn()
    const { result } = renderHook(() => useMemberActions('ws1', onChanged))

    await act(() => result.current.removeMember('u2'))

    expect(removeMember).toHaveBeenCalledWith('ws1', 'u2')
    expect(onChanged).toHaveBeenCalledOnce()
    expect(notifySuccess).toHaveBeenCalled()
  })

  it('toasts an error and does not refetch when a role update fails', async () => {
    updateMemberRole.mockRejectedValue(new Error('nope'))
    const onChanged = vi.fn()
    const { result } = renderHook(() => useMemberActions('ws1', onChanged))

    await act(() => result.current.updateRole('u2', 'ADMIN'))

    expect(notifyError).toHaveBeenCalled()
    expect(onChanged).not.toHaveBeenCalled()
    expect(result.current.pendingUserId).toBeNull()
  })

  it('exposes pendingUserId while a mutation is in flight', async () => {
    let resolve: (v: unknown) => void = () => {}
    removeMember.mockReturnValue(new Promise((r) => (resolve = r)))
    const { result } = renderHook(() => useMemberActions('ws1', vi.fn()))

    let pending: Promise<void>
    act(() => {
      pending = result.current.removeMember('u2')
    })
    await waitFor(() => expect(result.current.pendingUserId).toBe('u2'))

    await act(async () => {
      resolve(undefined)
      await pending
    })
    expect(result.current.pendingUserId).toBeNull()
  })
})

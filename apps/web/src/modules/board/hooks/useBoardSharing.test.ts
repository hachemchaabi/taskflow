import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

vi.mock('../data/boardApi', () => ({
  boardsApi: { members: { list: vi.fn(), add: vi.fn(), remove: vi.fn(), updateRole: vi.fn() } },
}))
vi.mock('../../workspace/data/workspaceApi', () => ({
  workspacesApi: { get: vi.fn() },
}))
vi.mock('../../workspace/hooks/useWorkspace', () => ({
  useWorkspace: () => ({ activeWorkspace: { id: 'w1' } }),
}))
vi.mock('../../auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}))
vi.mock('@/shared/utils/notify', () => ({ notifyError: vi.fn() }))

import { boardsApi } from '../data/boardApi'
import { workspacesApi } from '../../workspace/data/workspaceApi'
import { useBoardSharing } from './useBoardSharing'

const wsMembers = [
  {
    id: 'wm1',
    userId: 'u1',
    role: 'OWNER',
    user: { id: 'u1', name: 'Me', email: 'me@x.io', avatarUrl: null },
  },
  {
    id: 'wm2',
    userId: 'u2',
    role: 'MEMBER',
    user: { id: 'u2', name: 'Sam', email: 's@x.io', avatarUrl: null },
  },
]

describe('useBoardSharing', () => {
  beforeEach(() => vi.clearAllMocks())

  it('computes candidates as workspace members not on the board', async () => {
    vi.mocked(boardsApi.members.list).mockResolvedValue([
      { id: 'bm1', userId: 'u1', role: 'OWNER', user: wsMembers[0].user },
    ] as never)
    vi.mocked(workspacesApi.get).mockResolvedValue({ members: wsMembers } as never)

    const { result } = renderHook(() => useBoardSharing('b1', true))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.members).toHaveLength(1)
    expect(result.current.candidates.map((c) => c.userId)).toEqual(['u2'])
    expect(result.current.isOwner).toBe(true)
  })

  it('adds a member then reloads', async () => {
    vi.mocked(boardsApi.members.list).mockResolvedValue([] as never)
    vi.mocked(workspacesApi.get).mockResolvedValue({ members: wsMembers } as never)
    vi.mocked(boardsApi.members.add).mockResolvedValue({} as never)

    const { result } = renderHook(() => useBoardSharing('b1', true))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.add('u2')
    })

    expect(boardsApi.members.add).toHaveBeenCalledWith('b1', { userId: 'u2' })
    expect(boardsApi.members.list).toHaveBeenCalledTimes(2)
  })
})

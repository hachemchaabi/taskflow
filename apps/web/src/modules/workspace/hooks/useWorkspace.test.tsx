import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { ReactNode } from 'react'

vi.mock('../data/workspaceApi', () => ({
  workspacesApi: {
    list: vi.fn().mockResolvedValue([
      { id: 'a', name: 'A', description: null, role: 'OWNER', _count: { members: 1, boards: 0 } },
      { id: 'b', name: 'B', description: null, role: 'MEMBER', _count: { members: 2, boards: 1 } },
    ]),
  },
  invitesApi: {},
}))

vi.mock('../../auth/hooks/useAuth', () => ({
  useAuth: () => ({ status: 'authenticated' }),
}))

vi.mock('../../../shared/realtime/useRealtime', () => ({
  useRealtime: () => ({
    subscribe: () => () => {},
    joinWorkspace: () => {},
    leaveWorkspace: () => {},
  }),
}))

import { WorkspaceProvider } from '../data/WorkspaceContext'
import { useWorkspace } from './useWorkspace'

const wrapper = ({ children }: { children: ReactNode }) => (
  <WorkspaceProvider>{children}</WorkspaceProvider>
)

describe('useWorkspace', () => {
  beforeEach(() => localStorage.clear())

  it('loads workspaces and defaults the active to the first', async () => {
    const { result } = renderHook(() => useWorkspace(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.workspaces).toHaveLength(2)
    expect(result.current.activeWorkspace?.id).toBe('a')
  })

  it('switchWorkspace changes and persists the active id', async () => {
    const { result } = renderHook(() => useWorkspace(), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('ready'))
    act(() => result.current.switchWorkspace('b'))
    await waitFor(() => expect(result.current.activeWorkspace?.id).toBe('b'))
    expect(localStorage.getItem('ctm.workspace')).toBe('b')
  })
})

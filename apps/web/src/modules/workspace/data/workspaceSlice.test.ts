import { describe, it, expect } from 'vitest'
import { workspaceReducer, initialWorkspaceState, resolveActiveId } from './workspaceSlice'
import type { WorkspaceSummary } from '../../../shared/types'

const ws = (id: string): WorkspaceSummary => ({
  id,
  name: id,
  slug: id,
  description: null,
  logoUrl: null,
  locale: 'en',
  visibility: 'PRIVATE',
  defaultMemberRole: 'MEMBER',
  role: 'OWNER',
  _count: { members: 1, boards: 0 },
})

describe('workspaceReducer', () => {
  it('LOAD_SUCCESS stores workspaces and the resolved active id', () => {
    const next = workspaceReducer(initialWorkspaceState, {
      type: 'LOAD_SUCCESS',
      payload: { workspaces: [ws('a'), ws('b')], activeWorkspaceId: 'b' },
    })
    expect(next.status).toBe('ready')
    expect(next.activeWorkspaceId).toBe('b')
  })

  it('SET_ACTIVE switches the active workspace', () => {
    const loaded = workspaceReducer(initialWorkspaceState, {
      type: 'LOAD_SUCCESS',
      payload: { workspaces: [ws('a'), ws('b')], activeWorkspaceId: 'a' },
    })
    expect(workspaceReducer(loaded, { type: 'SET_ACTIVE', payload: 'b' }).activeWorkspaceId).toBe(
      'b',
    )
  })

  it('REMOVE_WORKSPACE drops it and falls back to the first remaining', () => {
    const loaded = workspaceReducer(initialWorkspaceState, {
      type: 'LOAD_SUCCESS',
      payload: { workspaces: [ws('a'), ws('b')], activeWorkspaceId: 'a' },
    })
    const next = workspaceReducer(loaded, { type: 'REMOVE_WORKSPACE', payload: 'a' })
    expect(next.workspaces.map((w) => w.id)).toEqual(['b'])
    expect(next.activeWorkspaceId).toBe('b')
  })

  it('resolveActiveId prefers a valid id, else the first, else null', () => {
    expect(resolveActiveId([ws('a'), ws('b')], 'b')).toBe('b')
    expect(resolveActiveId([ws('a')], 'zzz')).toBe('a')
    expect(resolveActiveId([], 'a')).toBeNull()
  })
})

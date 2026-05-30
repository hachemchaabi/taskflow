import { createContext, useCallback, useEffect, useReducer } from 'react'
import type { ReactNode } from 'react'
import { initialWorkspaceState, resolveActiveId, workspaceReducer } from './workspaceSlice'
import type { WorkspaceState } from './workspaceSlice'
import { workspacesApi } from './workspaceApi'
import type { WorkspaceUpdateInput } from './workspaceApi'
import type { WorkspaceDetail, WorkspaceSummary } from '../../../shared/types'
import { useAuth } from '../../auth/hooks/useAuth'
import { WORKSPACE_STORAGE_KEY } from '../../../shared/utils/constants'
import { readString, writeString, remove } from '../../../shared/utils/localStorage'
import { notifyError, notifyInfo } from '../../../shared/utils/notify'
import { useRealtime } from '../../../shared/realtime/useRealtime'
import { REALTIME_EVENTS } from '../../../shared/realtime/realtimeEvents'

interface WorkspaceContextValue extends WorkspaceState {
  activeWorkspace: WorkspaceState['workspaces'][number] | null
  switchWorkspace: (id: string) => void
  createWorkspace: (name: string, description?: string) => Promise<void>
  updateWorkspace: (id: string, input: WorkspaceUpdateInput) => Promise<WorkspaceSummary>
  uploadLogo: (id: string, file: File) => Promise<WorkspaceSummary>
  removeLogo: (id: string) => Promise<WorkspaceSummary>
  transferOwnership: (id: string, userId: string) => Promise<WorkspaceDetail>
  deleteWorkspace: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { status: authStatus } = useAuth()
  const [state, dispatch] = useReducer(workspaceReducer, initialWorkspaceState)

  const load = useCallback(async (signal?: AbortSignal) => {
    dispatch({ type: 'LOAD_START' })
    try {
      const workspaces = await workspacesApi.list(signal)
      dispatch({
        type: 'LOAD_SUCCESS',
        payload: { workspaces, activeWorkspaceId: readString(WORKSPACE_STORAGE_KEY) },
      })
    } catch (err) {
      if (signal?.aborted) return
      const message = err instanceof Error ? err.message : 'Could not load workspaces'
      dispatch({ type: 'LOAD_ERROR', payload: message })
    }
  }, [])

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      if (authStatus === 'idle') dispatch({ type: 'RESET' })
      return
    }
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [authStatus, load])

  useEffect(() => {
    if (state.activeWorkspaceId) writeString(WORKSPACE_STORAGE_KEY, state.activeWorkspaceId)
    else remove(WORKSPACE_STORAGE_KEY)
  }, [state.activeWorkspaceId])

  const { subscribe, joinWorkspace, leaveWorkspace } = useRealtime()

  useEffect(() => {
    const id = state.activeWorkspaceId
    if (authStatus !== 'authenticated' || !id) return
    joinWorkspace(id)
    return () => leaveWorkspace(id)
  }, [authStatus, state.activeWorkspaceId, joinWorkspace, leaveWorkspace])

  useEffect(() => {
    if (authStatus !== 'authenticated') return
    const offAdded = subscribe(REALTIME_EVENTS.workspaceAdded, () => {
      notifyInfo('You were added to a new workspace')
      void load()
    })
    const offRemoved = subscribe(REALTIME_EVENTS.workspaceRemoved, () => {
      notifyInfo('Your access to a workspace changed')
      void load()
    })
    return () => {
      offAdded()
      offRemoved()
    }
  }, [authStatus, subscribe, load])

  const switchWorkspace = useCallback(
    (id: string) => dispatch({ type: 'SET_ACTIVE', payload: id }),
    [],
  )

  const createWorkspace = useCallback(async (name: string, description?: string) => {
    try {
      const ws = await workspacesApi.create({ name, description })
      dispatch({ type: 'ADD_WORKSPACE', payload: ws })
    } catch {
      notifyError('Could not create the workspace.')
    }
  }, [])

  const updateWorkspace = useCallback(async (id: string, input: WorkspaceUpdateInput) => {
    const ws = await workspacesApi.update(id, input)
    dispatch({ type: 'UPDATE_WORKSPACE', payload: ws })
    return ws
  }, [])

  const uploadLogo = useCallback(async (id: string, file: File) => {
    const ws = await workspacesApi.uploadLogo(id, file)
    dispatch({ type: 'UPDATE_WORKSPACE', payload: ws })
    return ws
  }, [])

  const removeLogo = useCallback(async (id: string) => {
    const ws = await workspacesApi.removeLogo(id)
    dispatch({ type: 'UPDATE_WORKSPACE', payload: ws })
    return ws
  }, [])

  const transferOwnership = useCallback(async (id: string, userId: string) => {
    const detail = await workspacesApi.transferOwnership(id, userId)
    dispatch({ type: 'UPDATE_WORKSPACE', payload: detail })
    return detail
  }, [])

  const deleteWorkspace = useCallback(async (id: string) => {
    await workspacesApi.remove(id)
    dispatch({ type: 'REMOVE_WORKSPACE', payload: id })
  }, [])

  const refresh = useCallback(() => load(), [load])

  const activeWorkspace =
    state.workspaces.find(
      (w) => w.id === resolveActiveId(state.workspaces, state.activeWorkspaceId),
    ) ?? null

  return (
    <WorkspaceContext.Provider
      value={{
        ...state,
        activeWorkspace,
        switchWorkspace,
        createWorkspace,
        updateWorkspace,
        uploadLogo,
        removeLogo,
        transferOwnership,
        deleteWorkspace,
        refresh,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

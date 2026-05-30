import type { WorkspaceSummary } from '../../../shared/types'

export interface WorkspaceState {
  workspaces: WorkspaceSummary[]
  activeWorkspaceId: string | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
}

export type WorkspaceAction =
  | { type: 'LOAD_START' }
  | {
      type: 'LOAD_SUCCESS'
      payload: { workspaces: WorkspaceSummary[]; activeWorkspaceId: string | null }
    }
  | { type: 'LOAD_ERROR'; payload: string }
  | { type: 'SET_ACTIVE'; payload: string }
  | { type: 'ADD_WORKSPACE'; payload: WorkspaceSummary }
  | { type: 'UPDATE_WORKSPACE'; payload: WorkspaceSummary }
  | { type: 'REMOVE_WORKSPACE'; payload: string }
  | { type: 'RESET' }

export const initialWorkspaceState: WorkspaceState = {
  workspaces: [],
  activeWorkspaceId: null,
  status: 'idle',
  error: null,
}

export function resolveActiveId(
  workspaces: WorkspaceSummary[],
  preferredId: string | null,
): string | null {
  if (preferredId && workspaces.some((w) => w.id === preferredId)) return preferredId
  return workspaces[0]?.id ?? null
}

export function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, status: 'loading', error: null }
    case 'LOAD_SUCCESS':
      return {
        workspaces: action.payload.workspaces,
        activeWorkspaceId: resolveActiveId(
          action.payload.workspaces,
          action.payload.activeWorkspaceId,
        ),
        status: 'ready',
        error: null,
      }
    case 'LOAD_ERROR':
      return { ...state, status: 'error', error: action.payload }
    case 'SET_ACTIVE':
      return { ...state, activeWorkspaceId: action.payload }
    case 'ADD_WORKSPACE':
      return {
        ...state,
        workspaces: [...state.workspaces, action.payload],
        activeWorkspaceId: action.payload.id,
      }
    case 'UPDATE_WORKSPACE':
      return {
        ...state,
        workspaces: state.workspaces.map((w) => (w.id === action.payload.id ? action.payload : w)),
      }
    case 'REMOVE_WORKSPACE': {
      const workspaces = state.workspaces.filter((w) => w.id !== action.payload)
      return {
        ...state,
        workspaces,
        activeWorkspaceId:
          state.activeWorkspaceId === action.payload
            ? resolveActiveId(workspaces, null)
            : state.activeWorkspaceId,
      }
    }
    case 'RESET':
      return { ...initialWorkspaceState }
    default:
      return state
  }
}

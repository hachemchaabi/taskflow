import { useContext } from 'react'
import { WorkspaceContext } from '../data/WorkspaceContext'

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return ctx
}

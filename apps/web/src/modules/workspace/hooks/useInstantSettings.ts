import { useState } from 'react'
import type { WorkspaceUpdateInput } from '../data/workspaceApi'
import { useWorkspace } from './useWorkspace'
import { notifyError, notifySuccess } from '../../../shared/utils/notify'
import { WORKSPACE_MESSAGES } from '../constants'

export function useInstantSettings(workspaceId: string) {
  const { updateWorkspace } = useWorkspace()
  const [saving, setSaving] = useState(false)

  const update = async (input: WorkspaceUpdateInput) => {
    setSaving(true)
    try {
      await updateWorkspace(workspaceId, input)
      notifySuccess(WORKSPACE_MESSAGES.saved)
    } catch {
      notifyError(WORKSPACE_MESSAGES.saveError)
    } finally {
      setSaving(false)
    }
  }

  return { saving, update }
}

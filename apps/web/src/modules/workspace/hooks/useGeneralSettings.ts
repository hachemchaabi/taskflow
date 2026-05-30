import { useEffect, useState } from 'react'
import type { WorkspaceSummary } from '../../../shared/types'
import type { WorkspaceUpdateInput } from '../data/workspaceApi'
import { useWorkspace } from './useWorkspace'
import { notifyError, notifySuccess } from '../../../shared/utils/notify'
import {
  WORKSPACE_DESCRIPTION_MAX,
  WORKSPACE_MESSAGES,
  WORKSPACE_NAME_MAX,
  WORKSPACE_NAME_MIN,
} from '../constants'

export function useGeneralSettings(workspace: WorkspaceSummary | null) {
  const { updateWorkspace } = useWorkspace()
  const [name, setName] = useState(workspace?.name ?? '')
  const [description, setDescription] = useState(workspace?.description ?? '')
  const [nameError, setNameError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(workspace?.name ?? '')
    setDescription(workspace?.description ?? '')
    setNameError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id])

  const trimmedName = name.trim()
  const nameValid =
    trimmedName.length >= WORKSPACE_NAME_MIN && trimmedName.length <= WORKSPACE_NAME_MAX
  const descriptionValid = description.length <= WORKSPACE_DESCRIPTION_MAX
  const dirty = workspace
    ? trimmedName !== workspace.name ||
      (description.trim() || null) !== (workspace.description ?? null)
    : false
  const canSave = Boolean(workspace) && dirty && nameValid && descriptionValid && !saving

  const validateName = () => {
    setNameError(
      nameValid ? null : `Name must be ${WORKSPACE_NAME_MIN}–${WORKSPACE_NAME_MAX} characters.`,
    )
  }

  const save = async () => {
    if (!workspace || !canSave) return
    setSaving(true)
    try {
      const input: WorkspaceUpdateInput = {
        name: trimmedName,
        description: description.trim() || null,
      }
      await updateWorkspace(workspace.id, input)
      notifySuccess(WORKSPACE_MESSAGES.saved)
    } catch {
      notifyError(WORKSPACE_MESSAGES.saveError)
    } finally {
      setSaving(false)
    }
  }

  return {
    name,
    setName,
    description,
    setDescription,
    nameError,
    validateName,
    descriptionValid,
    descriptionRemaining: WORKSPACE_DESCRIPTION_MAX - description.length,
    canSave,
    saving,
    save,
  }
}

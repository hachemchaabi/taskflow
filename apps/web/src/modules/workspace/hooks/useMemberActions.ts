import { useState } from 'react'
import type { MemberRole } from '@/shared/types'
import { notifyError, notifySuccess } from '@/shared/utils/notify'
import { workspacesApi } from '../data/workspaceApi'
import { WORKSPACE_MESSAGES } from '../constants'

export function useMemberActions(workspaceId: string, onChanged: () => void) {
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)

  const updateRole = async (userId: string, role: MemberRole) => {
    setPendingUserId(userId)
    try {
      await workspacesApi.updateMemberRole(workspaceId, userId, role)
      onChanged()
      notifySuccess(WORKSPACE_MESSAGES.roleUpdated)
    } catch {
      notifyError(WORKSPACE_MESSAGES.roleUpdateError)
    } finally {
      setPendingUserId(null)
    }
  }

  const removeMember = async (userId: string) => {
    setPendingUserId(userId)
    try {
      await workspacesApi.removeMember(workspaceId, userId)
      onChanged()
      notifySuccess(WORKSPACE_MESSAGES.memberRemoved)
    } catch {
      notifyError(WORKSPACE_MESSAGES.memberRemoveError)
    } finally {
      setPendingUserId(null)
    }
  }

  return { updateRole, removeMember, pendingUserId }
}

import { useState } from 'react'
import type { MemberRole } from '@/shared/types'
import { notifyError, notifySuccess } from '@/shared/utils/notify'
import { workspacesApi } from '../data/workspaceApi'
import { WORKSPACE_MESSAGES } from '../constants'

export function useInviteActions(workspaceId: string, onChanged: () => void) {
  const [pendingInviteId, setPendingInviteId] = useState<string | null>(null)

  const updateRole = async (inviteId: string, role: MemberRole) => {
    setPendingInviteId(inviteId)
    try {
      await workspacesApi.updateInviteRole(workspaceId, inviteId, role)
      onChanged()
      notifySuccess(WORKSPACE_MESSAGES.inviteRoleUpdated)
    } catch {
      notifyError(WORKSPACE_MESSAGES.inviteRoleUpdateError)
    } finally {
      setPendingInviteId(null)
    }
  }

  const revokeInvite = async (inviteId: string) => {
    setPendingInviteId(inviteId)
    try {
      await workspacesApi.revokeInvite(workspaceId, inviteId)
      onChanged()
      notifySuccess(WORKSPACE_MESSAGES.inviteRevoked)
    } catch {
      notifyError(WORKSPACE_MESSAGES.inviteRevokeError)
    } finally {
      setPendingInviteId(null)
    }
  }

  return { updateRole, revokeInvite, pendingInviteId }
}

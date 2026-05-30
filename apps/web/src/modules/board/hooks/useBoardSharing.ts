import { useCallback, useEffect, useState } from 'react'
import type { BoardMember, MemberRole, WorkspaceMember } from '@/shared/types'
import { notifyError } from '@/shared/utils/notify'
import { useAuth } from '../../auth/hooks/useAuth'
import { workspacesApi } from '../../workspace/data/workspaceApi'
import { useWorkspace } from '../../workspace/hooks/useWorkspace'
import { boardsApi } from '../data/boardApi'

export function useBoardSharing(boardId: string, open: boolean) {
  const { activeWorkspace } = useWorkspace()
  const { user } = useAuth()
  const [members, setMembers] = useState<BoardMember[]>([])
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(false)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)

  const workspaceId = activeWorkspace?.id

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    try {
      const [bm, ws] = await Promise.all([
        boardsApi.members.list(boardId),
        workspacesApi.get(workspaceId),
      ])
      setMembers(bm)
      setWorkspaceMembers(ws.members)
    } catch {
      notifyError('Could not load sharing details.')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, boardId])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  const run = async (userId: string, fn: () => Promise<unknown>, failMsg: string) => {
    setBusyUserId(userId)
    try {
      await fn()
      await load()
    } catch {
      notifyError(failMsg)
    } finally {
      setBusyUserId(null)
    }
  }

  const memberIds = new Set(members.map((m) => m.userId))
  const candidates = workspaceMembers.filter((m) => !memberIds.has(m.userId))
  const myRole = members.find((m) => m.userId === user?.id)?.role ?? null
  const canManage = myRole === 'OWNER' || myRole === 'ADMIN'
  const isOwner = myRole === 'OWNER'

  return {
    loading,
    members,
    candidates,
    busyUserId,
    canManage,
    isOwner,
    add: (userId: string) =>
      run(userId, () => boardsApi.members.add(boardId, { userId }), 'Could not add that member.'),
    remove: (userId: string) =>
      run(userId, () => boardsApi.members.remove(boardId, userId), 'Could not remove that member.'),
    changeRole: (userId: string, role: MemberRole) =>
      run(
        userId,
        () => boardsApi.members.updateRole(boardId, userId, role),
        'Could not update the role.',
      ),
  }
}

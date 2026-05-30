import { useState } from 'react'
import { useFetch } from '@/shared/hooks/useFetch'
import { invitesApi } from '@/modules/workspace/data/workspaceApi'
import { useWorkspace } from '@/modules/workspace/hooks/useWorkspace'
import { notifyError } from '@/shared/utils/notify'

export function useMyInvites() {
  const { refresh } = useWorkspace()
  const {
    data: invites,
    loading,
    refetch,
  } = useFetch((signal) => invitesApi.mine(signal), [], { cacheKey: 'invites:mine' })
  const [pendingId, setPendingId] = useState<string | null>(null)

  const respond = async (id: string, action: 'accept' | 'decline') => {
    setPendingId(id)
    try {
      await invitesApi[action](id)
      if (action === 'accept') await refresh()
      refetch()
    } catch {
      notifyError('Could not update the invite.')
    } finally {
      setPendingId(null)
    }
  }

  return { invites, loading, pendingId, respond }
}

import { useFetch } from '@/shared/hooks/useFetch'
import { useWorkspace } from '@/modules/workspace/hooks/useWorkspace'
import { activityApi } from '../data/activityApi'
import { ACTIVITY_FEED_LIMIT } from '../constants'

export function useWorkspaceActivity() {
  const { activeWorkspace } = useWorkspace()
  const workspaceId = activeWorkspace?.id ?? null

  const { data, loading, error } = useFetch(
    (signal) => activityApi.list(workspaceId as string, ACTIVITY_FEED_LIMIT, signal),
    [workspaceId],
    { enabled: Boolean(workspaceId), cacheKey: `dashboard:activity:${workspaceId}` },
  )

  return { activities: data ?? [], loading, error }
}

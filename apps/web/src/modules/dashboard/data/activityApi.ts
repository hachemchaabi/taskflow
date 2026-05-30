import { apiClient } from '@/shared/services/client'
import type { User } from '@/shared/types'

export interface WorkspaceActivity {
  id: string
  action: string
  createdAt: string
  user: Pick<User, 'id' | 'name' | 'avatarUrl'>
  card: { id: string; title: string } | null
  board: { id: string; title: string }
}

export const activityApi = {
  list: (workspaceId: string, limit?: number, signal?: AbortSignal) =>
    apiClient
      .get<WorkspaceActivity[]>(`/workspaces/${workspaceId}/activity`, {
        params: limit ? { limit } : undefined,
        signal,
      })
      .then((r) => r.data),
}

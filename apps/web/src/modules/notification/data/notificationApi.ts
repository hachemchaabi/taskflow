import { apiClient } from '@/shared/services/client'
import type { AppNotification, NotificationPreferences, UpdatePreferencesInput } from './types'

export const notificationsApi = {
  list: (signal?: AbortSignal) =>
    apiClient.get<AppNotification[]>('/notifications', { signal }).then((r) => r.data),

  unreadCount: (signal?: AbortSignal) =>
    apiClient
      .get<{ count: number }>('/notifications/unread-count', { signal })
      .then((r) => r.data.count),

  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`).then(() => undefined),

  markAllRead: () => apiClient.post('/notifications/read-all').then(() => undefined),

  clear: (id: string) => apiClient.delete(`/notifications/${id}`).then(() => undefined),

  clearAll: () => apiClient.delete('/notifications').then(() => undefined),

  getPreferences: (signal?: AbortSignal) =>
    apiClient
      .get<NotificationPreferences>('/notifications/preferences', { signal })
      .then((r) => r.data),

  updatePreferences: (input: UpdatePreferencesInput) =>
    apiClient
      .patch<NotificationPreferences>('/notifications/preferences', input)
      .then((r) => r.data),

  addMute: (target: { workspaceId?: string; boardId?: string }) =>
    apiClient.post<NotificationPreferences>('/notifications/mutes', target).then((r) => r.data),

  removeMute: (id: string) =>
    apiClient.delete<NotificationPreferences>(`/notifications/mutes/${id}`).then((r) => r.data),
}

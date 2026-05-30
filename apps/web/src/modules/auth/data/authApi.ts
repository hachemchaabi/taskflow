import { apiClient, refreshSession } from '../../../shared/services/client'
import type { User } from '../../../shared/types'

export interface AuthResponse {
  token: string
  user: User
}

export const authApi = {
  register: (input: { name: string; email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/register', input).then((r) => r.data),

  login: (input: { email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login', input).then((r) => r.data),

  refresh: (): Promise<AuthResponse> => refreshSession(),

  logout: () => apiClient.post('/auth/logout').then(() => undefined),

  me: () => apiClient.get<{ user: User }>('/auth/me').then((r) => r.data),

  updateProfile: (input: { name: string }) =>
    apiClient.patch<{ user: User }>('/auth/me', input).then((r) => r.data),

  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('avatar', file)
    return apiClient
      .put<{ user: User }>('/auth/me/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  removeAvatar: () => apiClient.delete<{ user: User }>('/auth/me/avatar').then((r) => r.data),
}

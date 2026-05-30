import { apiClient } from '../../../shared/services/client'
import type { BoardDetail, BoardMember, BoardSummary, MemberRole } from '../../../shared/types'

export const boardsApi = {
  list: (workspaceId: string, signal?: AbortSignal) =>
    apiClient
      .get<BoardSummary[]>('/boards', { params: { workspaceId }, signal })
      .then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    apiClient.get<BoardDetail>(`/boards/${id}`, { signal }).then((r) => r.data),

  create: (input: { title: string; workspaceId: string }) =>
    apiClient.post<BoardSummary>('/boards', input).then((r) => r.data),

  update: (id: string, input: { title?: string }) =>
    apiClient.patch<BoardSummary>(`/boards/${id}`, input).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/boards/${id}`).then((r) => r.data),

  uploadIcon: (id: string, file: File) => {
    const form = new FormData()
    form.append('icon', file)
    return apiClient
      .put<BoardSummary>(`/boards/${id}/icon`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  removeIcon: (id: string) =>
    apiClient.delete<BoardSummary>(`/boards/${id}/icon`).then((r) => r.data),

  members: {
    list: (boardId: string, signal?: AbortSignal) =>
      apiClient.get<BoardMember[]>(`/boards/${boardId}/members`, { signal }).then((r) => r.data),

    add: (
      boardId: string,
      input: { userId: string; role?: Extract<MemberRole, 'ADMIN' | 'MEMBER'> },
    ) => apiClient.post<BoardMember>(`/boards/${boardId}/members`, input).then((r) => r.data),

    updateRole: (boardId: string, userId: string, role: MemberRole) =>
      apiClient
        .patch<BoardMember>(`/boards/${boardId}/members/${userId}`, { role })
        .then((r) => r.data),

    remove: (boardId: string, userId: string) =>
      apiClient.delete(`/boards/${boardId}/members/${userId}`).then((r) => r.data),
  },
}

export const healthApi = {
  check: (signal?: AbortSignal) =>
    apiClient.get<{ status: string; timestamp: string }>('/health', { signal }).then((r) => r.data),
}

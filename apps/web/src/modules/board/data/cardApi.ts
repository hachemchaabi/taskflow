import { apiClient } from '@/shared/services/client'
import type { CardDetail, Priority } from '@/shared/types'

export interface CreateCardInput {
  title: string
  listId: string
  description?: string | null
  priority?: Priority
  startDate?: string | null
  endDate?: string | null
  assigneeIds?: string[]
  labelIds?: string[]
}

export type UpdateCardInput = Partial<Omit<CreateCardInput, 'listId'>> & { listId?: string }

export const cardCacheKey = (id: string) => `card:${id}`

export const cardApi = {
  create: (boardId: string, input: CreateCardInput) =>
    apiClient.post<CardDetail>(`/boards/${boardId}/cards`, input).then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    apiClient.get<CardDetail>(`/cards/${id}`, { signal }).then((r) => r.data),

  update: (id: string, input: UpdateCardInput) =>
    apiClient.patch<CardDetail>(`/cards/${id}`, input).then((r) => r.data),

  addComment: (id: string, body: string, parentId?: string) =>
    apiClient.post(`/cards/${id}/comments`, { body, parentId }).then((r) => r.data),

  editComment: (cardId: string, commentId: string, body: string) =>
    apiClient.patch(`/cards/${cardId}/comments/${commentId}`, { body }).then((r) => r.data),

  deleteComment: (cardId: string, commentId: string) =>
    apiClient.delete(`/cards/${cardId}/comments/${commentId}`).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/cards/${id}`).then((r) => r.data),
}

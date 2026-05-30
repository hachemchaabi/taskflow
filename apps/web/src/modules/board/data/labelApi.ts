import { apiClient } from '@/shared/services/client'
import type { Label } from '@/shared/types'

export const labelApi = {
  create: (boardId: string, input: { name: string; color: string }) =>
    apiClient.post<Label>(`/boards/${boardId}/labels`, input).then((r) => r.data),
}

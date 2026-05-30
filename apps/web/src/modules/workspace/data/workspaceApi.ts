import { apiClient } from '../../../shared/services/client'
import type {
  Locale,
  MemberRole,
  Visibility,
  WorkspaceDetail,
  WorkspaceInvite,
  WorkspaceMember,
  WorkspaceSummary,
} from '../../../shared/types'

export interface WorkspaceUpdateInput {
  name?: string
  slug?: string
  description?: string | null
  locale?: Locale
  visibility?: Visibility
  defaultMemberRole?: Extract<MemberRole, 'ADMIN' | 'MEMBER'>
}

export interface SlugAvailability {
  slug: string
  valid: boolean
  available: boolean
}

export const workspacesApi = {
  list: (signal?: AbortSignal) =>
    apiClient.get<WorkspaceSummary[]>('/workspaces', { signal }).then((r) => r.data),

  get: (id: string, signal?: AbortSignal) =>
    apiClient.get<WorkspaceDetail>(`/workspaces/${id}`, { signal }).then((r) => r.data),

  create: (input: { name: string; description?: string }) =>
    apiClient.post<WorkspaceSummary>('/workspaces', input).then((r) => r.data),

  update: (id: string, input: WorkspaceUpdateInput) =>
    apiClient.patch<WorkspaceSummary>(`/workspaces/${id}`, input).then((r) => r.data),

  checkSlug: (slug: string, excludeId?: string, signal?: AbortSignal) =>
    apiClient
      .get<SlugAvailability>('/workspaces/slug-available', { params: { slug, excludeId }, signal })
      .then((r) => r.data),

  uploadLogo: (id: string, file: File) => {
    const form = new FormData()
    form.append('logo', file)
    return apiClient
      .put<WorkspaceSummary>(`/workspaces/${id}/logo`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  removeLogo: (id: string) =>
    apiClient.delete<WorkspaceSummary>(`/workspaces/${id}/logo`).then((r) => r.data),

  transferOwnership: (id: string, userId: string) =>
    apiClient
      .post<WorkspaceDetail>(`/workspaces/${id}/transfer-ownership`, { userId })
      .then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/workspaces/${id}`).then((r) => r.data),

  updateMemberRole: (id: string, userId: string, role: MemberRole) =>
    apiClient
      .patch<WorkspaceMember>(`/workspaces/${id}/members/${userId}`, { role })
      .then((r) => r.data),

  removeMember: (id: string, userId: string) =>
    apiClient.delete(`/workspaces/${id}/members/${userId}`).then((r) => r.data),

  listInvites: (id: string, signal?: AbortSignal) =>
    apiClient.get<WorkspaceInvite[]>(`/workspaces/${id}/invites`, { signal }).then((r) => r.data),

  createInvite: (id: string, input: { email: string; role?: MemberRole }) =>
    apiClient.post<WorkspaceInvite>(`/workspaces/${id}/invites`, input).then((r) => r.data),

  updateInviteRole: (id: string, inviteId: string, role: MemberRole) =>
    apiClient
      .patch<WorkspaceInvite>(`/workspaces/${id}/invites/${inviteId}`, { role })
      .then((r) => r.data),

  revokeInvite: (id: string, inviteId: string) =>
    apiClient.delete(`/workspaces/${id}/invites/${inviteId}`).then((r) => r.data),
}

export const invitesApi = {
  mine: (signal?: AbortSignal) =>
    apiClient.get<WorkspaceInvite[]>('/invites', { signal }).then((r) => r.data),

  accept: (id: string) => apiClient.post(`/invites/${id}/accept`).then(() => undefined),

  decline: (id: string) => apiClient.post(`/invites/${id}/decline`).then(() => undefined),
}

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../shared/services/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

import { apiClient } from '../../../shared/services/client'
import { boardsApi } from './boardApi'

describe('boardsApi.members', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists board members', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [{ id: 'bm1' }] } as never)
    const out = await boardsApi.members.list('b1')
    expect(apiClient.get).toHaveBeenCalledWith('/boards/b1/members', { signal: undefined })
    expect(out).toEqual([{ id: 'bm1' }])
  })

  it('adds a member', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 'bm2' } } as never)
    await boardsApi.members.add('b1', { userId: 'u2' })
    expect(apiClient.post).toHaveBeenCalledWith('/boards/b1/members', { userId: 'u2' })
  })

  it('updates a member role', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: {} } as never)
    await boardsApi.members.updateRole('b1', 'u2', 'ADMIN')
    expect(apiClient.patch).toHaveBeenCalledWith('/boards/b1/members/u2', { role: 'ADMIN' })
  })

  it('removes a member', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined } as never)
    await boardsApi.members.remove('b1', 'u2')
    expect(apiClient.delete).toHaveBeenCalledWith('/boards/b1/members/u2')
  })
})

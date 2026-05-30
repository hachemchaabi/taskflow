import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '../../../shared/services/client'
import { authApi } from './authApi'

const user = { id: '1', email: 'a@b.com', name: 'A', avatarUrl: null }

afterEach(() => {
  vi.restoreAllMocks()
})

describe('authApi', () => {
  it('register posts name/email/password and returns token + user', async () => {
    const post = vi
      .spyOn(apiClient, 'post')
      .mockResolvedValue({ data: { token: 'tok', user } } as never)
    const res = await authApi.register({ name: 'A', email: 'a@b.com', password: 'pw12345678' })
    expect(post).toHaveBeenCalledWith('/auth/register', {
      name: 'A',
      email: 'a@b.com',
      password: 'pw12345678',
    })
    expect(res).toEqual({ token: 'tok', user })
  })

  it('login posts email/password and returns token + user', async () => {
    const post = vi
      .spyOn(apiClient, 'post')
      .mockResolvedValue({ data: { token: 'tok', user } } as never)
    const res = await authApi.login({ email: 'a@b.com', password: 'pw12345678' })
    expect(post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'pw12345678' })
    expect(res).toEqual({ token: 'tok', user })
  })

  it('refresh posts to /auth/refresh with no body', async () => {
    const post = vi
      .spyOn(apiClient, 'post')
      .mockResolvedValue({ data: { token: 'tok2', user } } as never)
    const res = await authApi.refresh()
    expect(post).toHaveBeenCalledWith('/auth/refresh')
    expect(res).toEqual({ token: 'tok2', user })
  })

  it('logout posts to /auth/logout', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: undefined } as never)
    await authApi.logout()
    expect(post).toHaveBeenCalledWith('/auth/logout')
  })

  it('me gets /auth/me and returns the user', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { user } } as never)
    const res = await authApi.me()
    expect(get).toHaveBeenCalledWith('/auth/me')
    expect(res).toEqual({ user })
  })
})

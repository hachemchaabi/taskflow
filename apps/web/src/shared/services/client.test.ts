import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from './client'
import { toastManager } from '../ui/toast'

type RejectedHandler = (error: unknown) => Promise<unknown>

function getResponseRejectedHandler(): RejectedHandler {
  const handlers = (
    apiClient.interceptors.response as unknown as {
      handlers: { rejected: RejectedHandler }[]
    }
  ).handlers
  const handler = handlers.at(-1)?.rejected
  if (!handler) throw new Error('no response rejection handler registered')
  return handler
}

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

beforeEach(() => {
  localStorage.clear()
})

describe('apiClient 401 refresh interceptor', () => {
  it('on 401 refreshes once, stores the new token, and replays the request', async () => {
    const post = vi
      .spyOn(apiClient, 'post')
      .mockResolvedValue({ data: { token: 'new-token', user: {} } } as never)
    const request = vi.spyOn(apiClient, 'request').mockResolvedValue({ data: 'ok' } as never)

    const handler = getResponseRejectedHandler()
    const error = {
      response: { status: 401 },
      config: { url: '/boards', headers: {} },
    }

    const result = (await handler(error)) as { data: string }

    expect(post).toHaveBeenCalledWith('/auth/refresh')
    expect(localStorage.getItem('ctm.token')).toBe('new-token')
    expect(request).toHaveBeenCalledTimes(1)
    expect(result.data).toBe('ok')
  })

  it('does not try to refresh a failed refresh call (avoids a loop)', async () => {
    const post = vi.spyOn(apiClient, 'post')
    localStorage.setItem('ctm.token', 'stale')

    const handler = getResponseRejectedHandler()
    const error = {
      response: { status: 401 },
      config: { url: '/auth/refresh', headers: {} },
    }

    await expect(handler(error)).rejects.toBe(error)
    expect(post).not.toHaveBeenCalled()
  })

  it('clears the token, shows a session-expired toast, and rejects when refresh fails', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('refresh failed'))
    const add = vi.spyOn(toastManager, 'add')
    localStorage.setItem('ctm.token', 'stale')

    const handler = getResponseRejectedHandler()
    const error = {
      response: { status: 401 },
      config: { url: '/boards', headers: {} },
    }

    await expect(handler(error)).rejects.toBe(error)
    expect(localStorage.getItem('ctm.token')).toBeNull()
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
  })

  it('passes through non-401 errors untouched', async () => {
    const post = vi.spyOn(apiClient, 'post')
    const handler = getResponseRejectedHandler()
    const error = { response: { status: 500 }, config: { url: '/boards', headers: {} } }
    await expect(handler(error)).rejects.toBe(error)
    expect(post).not.toHaveBeenCalled()
  })

  it('shares a single refresh across concurrent 401s', async () => {
    let resolveRefresh: (v: unknown) => void = () => {}
    const post = vi.spyOn(apiClient, 'post').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve
        }) as never,
    )
    const request = vi.spyOn(apiClient, 'request').mockResolvedValue({ data: 'ok' } as never)

    const handler = getResponseRejectedHandler()
    const make = () =>
      handler({ response: { status: 401 }, config: { url: '/boards', headers: {} } })

    const first = make()
    const second = make()
    resolveRefresh({ data: { token: 'shared-token', user: {} } })
    await Promise.all([first, second])

    expect(post).toHaveBeenCalledTimes(1)
    expect(post).toHaveBeenCalledWith('/auth/refresh')
    expect(request).toHaveBeenCalledTimes(2)
    expect(localStorage.getItem('ctm.token')).toBe('shared-token')
  })
})

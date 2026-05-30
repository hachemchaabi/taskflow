import { renderHook, waitFor, act } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { invalidateCache, useFetch } from './useFetch'

afterEach(() => {
  invalidateCache()
  vi.restoreAllMocks()
})

describe('useFetch', () => {
  it('starts loading and resolves with data', async () => {
    const { result } = renderHook(() => useFetch(() => Promise.resolve('hello')))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe('hello')
    expect(result.current.error).toBeNull()
  })

  it('surfaces an error message when the fetcher rejects', async () => {
    const { result } = renderHook(() => useFetch(() => Promise.reject(new Error('boom'))))

    await waitFor(() => expect(result.current.error).toBe('boom'))
    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('stays out of loading and reports no data when disabled', () => {
    const fetcher = vi.fn(() => Promise.resolve('x'))
    const { result } = renderHook(() => useFetch(fetcher, [], { enabled: false }))

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBeNull()
    expect(fetcher).not.toHaveBeenCalled()
  })

  describe('with a cacheKey', () => {
    it('serves cached data immediately on remount without a loading flash', async () => {
      const fetcher = vi.fn(() => Promise.resolve({ n: 1 }))

      const first = renderHook(() => useFetch(fetcher, [], { cacheKey: 'k' }))
      await waitFor(() => expect(first.result.current.data).toEqual({ n: 1 }))
      first.unmount()

      const second = renderHook(() => useFetch(fetcher, [], { cacheKey: 'k' }))
      expect(second.result.current.loading).toBe(false)
      expect(second.result.current.data).toEqual({ n: 1 })

      await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
    })

    it('revalidates in the background and swaps in fresh data', async () => {
      let value = 1
      const fetcher = vi.fn(() => Promise.resolve({ n: value }))

      const first = renderHook(() => useFetch(fetcher, [], { cacheKey: 'k' }))
      await waitFor(() => expect(first.result.current.data).toEqual({ n: 1 }))
      first.unmount()

      value = 2
      const second = renderHook(() => useFetch(fetcher, [], { cacheKey: 'k' }))
      expect(second.result.current.data).toEqual({ n: 1 })
      await waitFor(() => expect(second.result.current.data).toEqual({ n: 2 }))
      expect(fetcher).toHaveBeenCalledTimes(2)
    })

    it('keeps stale cached data when a background revalidation fails', async () => {
      const fetcher = vi
        .fn<() => Promise<{ n: number }>>()
        .mockResolvedValueOnce({ n: 1 })
        .mockRejectedValueOnce(new Error('offline'))

      const first = renderHook(() => useFetch(fetcher, [], { cacheKey: 'k' }))
      await waitFor(() => expect(first.result.current.data).toEqual({ n: 1 }))
      first.unmount()

      const second = renderHook(() => useFetch(fetcher, [], { cacheKey: 'k' }))
      await waitFor(() => expect(second.result.current.loading).toBe(false))
      expect(second.result.current.data).toEqual({ n: 1 })
      expect(second.result.current.error).toBeNull()
    })

    it('refetches after the entry is invalidated', async () => {
      const fetcher = vi.fn(() => Promise.resolve('v'))
      const first = renderHook(() => useFetch(fetcher, [], { cacheKey: 'k' }))
      await waitFor(() => expect(first.result.current.data).toBe('v'))
      first.unmount()

      invalidateCache('k')

      const second = renderHook(() => useFetch(fetcher, [], { cacheKey: 'k' }))
      expect(second.result.current.loading).toBe(true)
      expect(second.result.current.data).toBeNull()

      await waitFor(() => expect(second.result.current.data).toBe('v'))
    })

    it('refetch forces a fresh request', async () => {
      const fetcher = vi.fn(() => Promise.resolve('v'))
      const { result } = renderHook(() => useFetch(fetcher, [], { cacheKey: 'k' }))
      await waitFor(() => expect(result.current.loading).toBe(false))

      act(() => result.current.refetch())
      await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
    })
  })
})

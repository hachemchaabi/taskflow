import { useEffect, useState } from 'react'

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

const cache = new Map<string, unknown>()

export function readCache<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined
}

export function writeCache<T>(key: string, value: T): void {
  cache.set(key, value)
}

export function invalidateCache(key?: string): void {
  if (key === undefined) cache.clear()
  else cache.delete(key)
}

export function useFetch<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
  options: { enabled?: boolean; cacheKey?: string } = {},
): FetchState<T> & { refetch: () => void } {
  const { enabled = true, cacheKey } = options
  const [state, setState] = useState<FetchState<T>>(() => {
    const cached = cacheKey !== undefined ? readCache<T>(cacheKey) : undefined
    return {
      data: cached ?? null,
      loading: enabled && cached === undefined,
      error: null,
    }
  })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null })
      return
    }

    const controller = new AbortController()
    const cached = cacheKey !== undefined ? readCache<T>(cacheKey) : undefined
    setState((s) =>
      cached !== undefined
        ? { data: cached, loading: false, error: null }
        : { ...s, loading: true, error: null },
    )

    fetcher(controller.signal)
      .then((data) => {
        if (cacheKey !== undefined) writeCache(cacheKey, data)
        setState({ data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        const message = err instanceof Error ? err.message : 'Request failed'
        setState((s) =>
          s.data !== null
            ? { ...s, loading: false }
            : { data: null, loading: false, error: message },
        )
      })

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, enabled])

  return { ...state, refetch: () => setNonce((n) => n + 1) }
}

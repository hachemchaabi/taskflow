import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { User } from '../types'
import { TOKEN_STORAGE_KEY } from '../utils/constants'
import { readString, writeString, remove } from '../utils/localStorage'
import { notifyError } from '../utils/notify'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const token = readString(TOKEN_STORAGE_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<{ token: string; user: User }> | null = null

export function refreshSession(): Promise<{ token: string; user: User }> {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post<{ token: string; user: User }>('/auth/refresh')
      .then((res) => {
        writeString(TOKEN_STORAGE_KEY, res.data.token)
        return res.data
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    const status = error.response?.status
    const isRefreshCall = config?.url?.endsWith('/auth/refresh')

    if (status !== 401 || !config || config._retry || isRefreshCall) {
      return Promise.reject(error)
    }

    config._retry = true
    try {
      const { token } = await refreshSession()
      config.headers.Authorization = `Bearer ${token}`
      return apiClient.request(config)
    } catch {
      remove(TOKEN_STORAGE_KEY)
      notifyError('Session expired', 'Please log in again.')
      return Promise.reject(error)
    }
  },
)

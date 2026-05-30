import { isAxiosError } from 'axios'
import { useState } from 'react'
import { notifyError } from '@/shared/utils/notify'
import { invalidateCache } from '@/shared/hooks/useFetch'
import { cardApi, cardCacheKey } from '../data/cardApi'

export function useDeleteCard(cardId: string, onDeleted: () => void) {
  const [deleting, setDeleting] = useState(false)

  const remove = async (): Promise<boolean> => {
    setDeleting(true)
    try {
      await cardApi.remove(cardId)
      invalidateCache(cardCacheKey(cardId))
      onDeleted()
      return true
    } catch (err) {
      const serverMessage = isAxiosError<{ error?: string }>(err)
        ? err.response?.data?.error
        : undefined
      notifyError(serverMessage ?? 'Could not delete the task.')
      return false
    } finally {
      setDeleting(false)
    }
  }

  return { deleting, remove }
}

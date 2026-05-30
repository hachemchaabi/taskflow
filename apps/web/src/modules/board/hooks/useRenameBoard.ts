import { isAxiosError } from 'axios'
import { useState } from 'react'
import { notifyError } from '@/shared/utils/notify'
import { boardsApi } from '../data/boardApi'

export function useRenameBoard(boardId: string, onRenamed: () => void) {
  const [submitting, setSubmitting] = useState(false)

  const rename = async (title: string): Promise<boolean> => {
    const next = title.trim()
    if (!next) return false
    setSubmitting(true)
    try {
      await boardsApi.update(boardId, { title: next })
      onRenamed()
      return true
    } catch (err) {
      const serverMessage = isAxiosError<{ error?: string }>(err)
        ? err.response?.data?.error
        : undefined
      notifyError(serverMessage ?? 'Could not rename the list.')
      return false
    } finally {
      setSubmitting(false)
    }
  }

  return { submitting, rename }
}

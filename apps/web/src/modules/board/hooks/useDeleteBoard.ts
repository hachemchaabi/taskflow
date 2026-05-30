import { isAxiosError } from 'axios'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { notifyError } from '@/shared/utils/notify'
import { boardsApi } from '../data/boardApi'

export function useDeleteBoard(boardId: string, onDeleted: () => void) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [deleting, setDeleting] = useState(false)

  const remove = async (): Promise<boolean> => {
    setDeleting(true)
    try {
      await boardsApi.remove(boardId)
      onDeleted()
      if (pathname === `/boards/${boardId}`) navigate('/')
      return true
    } catch (err) {
      const serverMessage = isAxiosError<{ error?: string }>(err)
        ? err.response?.data?.error
        : undefined
      notifyError(serverMessage ?? 'Could not delete the list.')
      return false
    } finally {
      setDeleting(false)
    }
  }

  return { deleting, remove }
}

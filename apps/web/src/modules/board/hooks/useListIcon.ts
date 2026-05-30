import { useState } from 'react'
import { notifyError } from '@/shared/utils/notify'
import { boardsApi } from '../data/boardApi'
import { BOARD_ICON_MAX_BYTES, BOARD_ICON_MESSAGES, BOARD_ICON_MIME } from '../constants'

export function useListIcon(boardId: string, onChanged: () => void) {
  const [busy, setBusy] = useState(false)

  const upload = async (file: File) => {
    if (!BOARD_ICON_MIME.includes(file.type)) {
      notifyError(BOARD_ICON_MESSAGES.typeError)
      return
    }
    if (file.size > BOARD_ICON_MAX_BYTES) {
      notifyError(BOARD_ICON_MESSAGES.sizeError)
      return
    }
    setBusy(true)
    try {
      await boardsApi.uploadIcon(boardId, file)
      onChanged()
    } catch {
      notifyError(BOARD_ICON_MESSAGES.error)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await boardsApi.removeIcon(boardId)
      onChanged()
    } catch {
      notifyError(BOARD_ICON_MESSAGES.error)
    } finally {
      setBusy(false)
    }
  }

  return { busy, upload, remove }
}

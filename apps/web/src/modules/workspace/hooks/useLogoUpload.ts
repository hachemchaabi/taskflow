import { useState } from 'react'
import { useWorkspace } from './useWorkspace'
import { notifyError } from '../../../shared/utils/notify'
import { WORKSPACE_LOGO_MAX_BYTES, WORKSPACE_LOGO_MIME, WORKSPACE_MESSAGES } from '../constants'

export function useLogoUpload(workspaceId: string) {
  const { uploadLogo, removeLogo } = useWorkspace()
  const [busy, setBusy] = useState(false)

  const upload = async (file: File) => {
    if (!WORKSPACE_LOGO_MIME.includes(file.type)) {
      notifyError(WORKSPACE_MESSAGES.logoTypeError)
      return
    }
    if (file.size > WORKSPACE_LOGO_MAX_BYTES) {
      notifyError(WORKSPACE_MESSAGES.logoSizeError)
      return
    }
    setBusy(true)
    try {
      await uploadLogo(workspaceId, file)
    } catch {
      notifyError(WORKSPACE_MESSAGES.logoError)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await removeLogo(workspaceId)
    } catch {
      notifyError(WORKSPACE_MESSAGES.logoError)
    } finally {
      setBusy(false)
    }
  }

  return { busy, upload, remove }
}

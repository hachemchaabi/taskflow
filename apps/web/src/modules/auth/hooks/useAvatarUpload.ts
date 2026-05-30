import { useState } from 'react'
import { useAuth } from './useAuth'
import { notifyError } from '../../../shared/utils/notify'
import { AVATAR_MAX_BYTES, AVATAR_MIME, PROFILE_MESSAGES } from '../constants'

export function useAvatarUpload() {
  const { uploadAvatar, removeAvatar } = useAuth()
  const [busy, setBusy] = useState(false)

  const upload = async (file: File) => {
    if (!AVATAR_MIME.includes(file.type)) {
      notifyError(PROFILE_MESSAGES.avatarTypeError)
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      notifyError(PROFILE_MESSAGES.avatarSizeError)
      return
    }
    setBusy(true)
    try {
      await uploadAvatar(file)
    } catch {
      notifyError(PROFILE_MESSAGES.avatarError)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await removeAvatar()
    } catch {
      notifyError(PROFILE_MESSAGES.avatarError)
    } finally {
      setBusy(false)
    }
  }

  return { busy, upload, remove }
}

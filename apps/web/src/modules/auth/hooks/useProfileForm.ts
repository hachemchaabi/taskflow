import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { notifyError, notifySuccess } from '../../../shared/utils/notify'
import { PROFILE_MESSAGES, PROFILE_NAME_MAX, PROFILE_NAME_MIN } from '../constants'

export function useProfileForm() {
  const { user, updateProfile } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [nameError, setNameError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(user?.name ?? '')
    setNameError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const trimmedName = name.trim()
  const nameValid = trimmedName.length >= PROFILE_NAME_MIN && trimmedName.length <= PROFILE_NAME_MAX
  const dirty = user ? trimmedName !== user.name : false
  const canSave = Boolean(user) && dirty && nameValid && !saving

  const validateName = () => {
    setNameError(nameValid ? null : 'Please enter your name.')
  }

  const save = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await updateProfile(trimmedName)
      notifySuccess(PROFILE_MESSAGES.saved)
    } catch {
      notifyError(PROFILE_MESSAGES.saveError)
    } finally {
      setSaving(false)
    }
  }

  return { name, setName, nameError, validateName, canSave, saving, save }
}

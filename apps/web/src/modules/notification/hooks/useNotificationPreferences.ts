import { useEffect, useState } from 'react'
import { useFetch } from '@/shared/hooks/useFetch'
import { notifyError } from '@/shared/utils/notify'
import { notificationsApi } from '../data/notificationApi'
import type {
  NotificationPreferences,
  NotificationToggle,
  UpdatePreferencesInput,
} from '../data/types'

export function useNotificationPreferences() {
  const { data, loading } = useFetch((signal) => notificationsApi.getPreferences(signal), [], {
    cacheKey: 'notifications:preferences',
  })
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null)

  useEffect(() => {
    if (data) setPrefs(data)
  }, [data])

  const save = async (
    input: UpdatePreferencesInput,
    optimistic?: Partial<NotificationPreferences>,
  ) => {
    if (optimistic) setPrefs((p) => (p ? { ...p, ...optimistic } : p))
    try {
      setPrefs(await notificationsApi.updatePreferences(input))
    } catch {
      notifyError('Could not update your notification settings.')
      if (data) setPrefs(data)
    }
  }

  const toggle = (key: NotificationToggle, value: boolean) =>
    save({ [key]: value }, { [key]: value } as Partial<NotificationPreferences>)

  const setDnd = (dndUntil: string | null) => save({ dndUntil })

  const muteWorkspace = async (workspaceId: string) => {
    try {
      setPrefs(await notificationsApi.addMute({ workspaceId }))
    } catch {
      notifyError('Could not mute that workspace.')
    }
  }

  const muteBoard = async (boardId: string) => {
    try {
      setPrefs(await notificationsApi.addMute({ boardId }))
    } catch {
      notifyError('Could not mute that board.')
    }
  }

  const unmute = async (id: string) => {
    try {
      setPrefs(await notificationsApi.removeMute(id))
    } catch {
      notifyError('Could not unmute.')
    }
  }

  return {
    prefs,
    loading: loading && !prefs,
    toggle,
    setDnd,
    muteWorkspace,
    muteBoard,
    unmute,
  }
}

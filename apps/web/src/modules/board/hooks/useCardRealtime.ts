import { useCallback, useEffect, useRef } from 'react'
import { useRealtime } from '@/shared/realtime/useRealtime'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { notifyInfo } from '@/shared/utils/notify'
import {
  REALTIME_EVENTS,
  type Actor,
  type CardChangedPayload,
} from '@/shared/realtime/realtimeEvents'

interface Args {
  boardId: string
  cardId: string
  cardTitle: string
  onExternalChange: () => void
}

export function useCardRealtime({ boardId, cardId, cardTitle, onExternalChange }: Args): {
  typingUsers: Actor[]
  onTyping: () => void
  setEditing: (editing: boolean) => void
} {
  const { user } = useAuth()
  const { subscribe, setContext, emitTyping, typingForCard } = useRealtime()

  const onExternalChangeRef = useRef(onExternalChange)
  onExternalChangeRef.current = onExternalChange

  useEffect(() => {
    setContext(boardId, { type: 'card', cardId, cardTitle, editing: false })
    return () => setContext(boardId, { type: 'board', editing: false })
  }, [boardId, cardId, cardTitle, setContext])

  useEffect(() => {
    const off = subscribe(REALTIME_EVENTS.cardChanged, (raw) => {
      const payload = raw as CardChangedPayload
      if (payload.cardId !== cardId) return
      if (payload.actor.id !== user?.id) notifyInfo(`${payload.actor.name} updated this card`)
      onExternalChangeRef.current()
    })
    return off
  }, [cardId, user?.id, subscribe])

  const onTyping = useCallback(() => emitTyping(boardId, cardId), [emitTyping, boardId, cardId])
  const setEditing = useCallback(
    (editing: boolean) => setContext(boardId, { type: 'card', cardId, cardTitle, editing }),
    [setContext, boardId, cardId, cardTitle],
  )

  const typingUsers = typingForCard(cardId).filter((u) => u.id !== user?.id)

  return { typingUsers, onTyping, setEditing }
}

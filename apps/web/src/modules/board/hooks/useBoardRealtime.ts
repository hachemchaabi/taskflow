import { useEffect, useRef, useState } from 'react'
import { useRealtime } from '@/shared/realtime/useRealtime'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { invalidateCache } from '@/shared/hooks/useFetch'
import {
  REALTIME_EVENTS,
  type BoardChangedPayload,
  type PresenceUser,
} from '@/shared/realtime/realtimeEvents'

const HIGHLIGHT_MS = 2000

export function useBoardRealtime(
  boardId: string,
  onChanged: () => void,
): { presence: PresenceUser[]; highlightedCardId: string | null } {
  const { user } = useAuth()
  const { subscribe, joinBoard, leaveBoard, setContext, presenceForBoard } = useRealtime()
  const [highlightedCardId, setHighlightedCardId] = useState<string | null>(null)

  const onChangedRef = useRef(onChanged)
  onChangedRef.current = onChanged
  const highlightTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!boardId) return
    joinBoard(boardId)
    setContext(boardId, { type: 'board', editing: false })

    const off = subscribe(REALTIME_EVENTS.boardChanged, (raw) => {
      const payload = raw as BoardChangedPayload
      if (payload.boardId !== boardId) return
      invalidateCache(`board:${boardId}`)
      onChangedRef.current()
      if (payload.cardId && payload.actor.id !== user?.id) {
        setHighlightedCardId(payload.cardId)
        if (highlightTimer.current) clearTimeout(highlightTimer.current)
        highlightTimer.current = setTimeout(() => setHighlightedCardId(null), HIGHLIGHT_MS)
      }
    })

    return () => {
      off()
      leaveBoard(boardId)
      if (highlightTimer.current) clearTimeout(highlightTimer.current)
    }
  }, [boardId, user?.id, subscribe, joinBoard, leaveBoard, setContext])

  return { presence: presenceForBoard(boardId), highlightedCardId }
}

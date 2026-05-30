import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { isAxiosError } from 'axios'
import { type Dispatch, type SetStateAction, useCallback, useEffect, useRef, useState } from 'react'
import type { BoardDetail, Card } from '@/shared/types'
import { notifyError } from '@/shared/utils/notify'
import { writeCache } from '@/shared/hooks/useFetch'
import { cardApi, cardCacheKey } from '../data/cardApi'

export interface KanbanColumn {
  id: string
  name: string
  [key: string]: unknown
}

export interface KanbanItem {
  id: string
  name: string
  column: string
  card: Card
  [key: string]: unknown
}

const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position

function toItems(board: BoardDetail): KanbanItem[] {
  return [...board.lists].sort(byPosition).flatMap((list) =>
    [...list.cards].sort(byPosition).map((card) => ({
      id: card.id,
      name: card.title,
      column: list.id,
      card,
    })),
  )
}

export function useBoardKanban(board: BoardDetail, matches: (card: Card) => boolean = () => true) {
  const columns: KanbanColumn[] = [...board.lists]
    .sort(byPosition)
    .map((list) => ({ id: list.id, name: list.title }))

  const [items, setItems] = useState<KanbanItem[]>(() => toItems(board))

  useEffect(() => {
    setItems(toItems(board))
  }, [board])

  const visibleItems = items.filter((item) => matches(item.card))

  const setVisibleItems: Dispatch<SetStateAction<KanbanItem[]>> = (action) => {
    setItems((prev) => {
      const visible = prev.filter((item) => matches(item.card))
      const hidden = prev.filter((item) => !matches(item.card))
      const next = typeof action === 'function' ? action(visible) : action
      return hidden.length ? [...next, ...hidden] : next
    })
  }

  const countFor = (columnId: string) =>
    visibleItems.filter((item) => item.column === columnId).length

  const dragOrigin = useRef<{ id: string; column: string } | null>(null)

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      const item = items.find((it) => it.id === event.active.id)
      dragOrigin.current = item ? { id: item.id, column: item.column } : null
    },
    [items],
  )

  const onDragEnd = useCallback(
    async (_event: DragEndEvent) => {
      const origin = dragOrigin.current
      dragOrigin.current = null
      if (!origin) return

      const moved = items.find((it) => it.id === origin.id)
      if (!moved || moved.column === origin.column) return

      try {
        const updated = await cardApi.update(origin.id, { listId: moved.column })
        writeCache(cardCacheKey(origin.id), updated)
      } catch (err) {
        setItems((prev) =>
          prev.map((it) => (it.id === origin.id ? { ...it, column: origin.column } : it)),
        )
        const message = isAxiosError<{ error?: string }>(err)
          ? err.response?.data?.error
          : undefined
        notifyError(message ?? 'Could not move the task.')
      }
    },
    [items],
  )

  return {
    columns,
    items: visibleItems,
    setItems: setVisibleItems,
    countFor,
    onDragStart,
    onDragEnd,
  }
}

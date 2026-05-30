import { useMemo } from 'react'
import { useFetch } from '@/shared/hooks/useFetch'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { useWorkspace } from '@/modules/workspace/hooks/useWorkspace'
import { boardsApi } from '@/modules/board/data/boardApi'
import { PRIORITY_ORDER } from '@/modules/board/constants'
import type { BoardDetail, Card } from '@/shared/types'

export interface MyTask extends Card {
  boardId: string
  boardTitle: string
  listId: string
}

export function collectMyTasks(boards: BoardDetail[], userId: string): MyTask[] {
  const tasks: MyTask[] = []
  for (const board of boards) {
    for (const list of board.lists) {
      for (const card of list.cards) {
        if (card.assignees.some((a) => a.id === userId)) {
          tasks.push({ ...card, boardId: board.id, boardTitle: board.title, listId: list.id })
        }
      }
    }
  }
  return tasks
}

export function sortByPriority(tasks: MyTask[]): MyTask[] {
  return [...tasks].sort((a, b) => {
    const byPriority = PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
    if (byPriority !== 0) return byPriority
    const dueA = a.endDate ? Date.parse(a.endDate) : Number.POSITIVE_INFINITY
    const dueB = b.endDate ? Date.parse(b.endDate) : Number.POSITIVE_INFINITY
    return dueA - dueB
  })
}

export function useMyTasks() {
  const { user } = useAuth()
  const { activeWorkspace } = useWorkspace()
  const workspaceId = activeWorkspace?.id ?? null

  const { data, loading, error } = useFetch(
    async (signal) => {
      const summaries = await boardsApi.list(workspaceId as string, signal)
      return Promise.all(summaries.map((board) => boardsApi.get(board.id, signal)))
    },
    [workspaceId],
    { enabled: Boolean(workspaceId), cacheKey: `dashboard:mytasks:${workspaceId}` },
  )

  const tasks = useMemo(() => {
    if (!data || !user) return []
    return sortByPriority(collectMyTasks(data, user.id))
  }, [data, user])

  return { tasks, loading, error }
}

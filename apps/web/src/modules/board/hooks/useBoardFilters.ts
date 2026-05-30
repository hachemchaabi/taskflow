import { useCallback, useMemo, useState } from 'react'
import type { Card, Priority } from '@/shared/types'

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

export function useBoardFilters() {
  const [query, setQuery] = useState('')
  const [priorities, setPriorities] = useState<Set<Priority>>(new Set())
  const [labelIds, setLabelIds] = useState<Set<string>>(new Set())
  const [assigneeIds, setAssigneeIds] = useState<Set<string>>(new Set())

  const togglePriority = useCallback((p: Priority) => setPriorities((s) => toggle(s, p)), [])
  const toggleLabel = useCallback((id: string) => setLabelIds((s) => toggle(s, id)), [])
  const toggleAssignee = useCallback((id: string) => setAssigneeIds((s) => toggle(s, id)), [])

  const clear = useCallback(() => {
    setQuery('')
    setPriorities(new Set())
    setLabelIds(new Set())
    setAssigneeIds(new Set())
  }, [])

  const trimmedQuery = query.trim()
  const activeCount = (trimmedQuery ? 1 : 0) + priorities.size + labelIds.size + assigneeIds.size

  const matches = useMemo(() => {
    const needle = trimmedQuery.toLowerCase()
    return (card: Card) => {
      if (needle && !card.title.toLowerCase().includes(needle)) return false
      if (priorities.size && !priorities.has(card.priority)) return false
      if (labelIds.size && !card.labels.some((l) => labelIds.has(l.id))) return false
      if (assigneeIds.size && !card.assignees.some((a) => assigneeIds.has(a.id))) return false
      return true
    }
  }, [trimmedQuery, priorities, labelIds, assigneeIds])

  return {
    query,
    setQuery,
    priorities,
    labelIds,
    assigneeIds,
    togglePriority,
    toggleLabel,
    toggleAssignee,
    activeCount,
    matches,
    clear,
  }
}

export type BoardFilters = ReturnType<typeof useBoardFilters>

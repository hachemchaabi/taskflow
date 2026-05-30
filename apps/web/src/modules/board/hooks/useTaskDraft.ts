import { useCallback, useEffect, useState } from 'react'
import type { CardDetail, Priority } from '@/shared/types'
import { cardApi, cardCacheKey, type CreateCardInput, type UpdateCardInput } from '../data/cardApi'
import { readCache, writeCache } from '@/shared/hooks/useFetch'
import { notifyError } from '@/shared/utils/notify'

interface CreateArgs {
  mode: 'create'
  boardId: string
  listId?: string
  onCreated: (cardId: string) => void
  onChanged: () => void
}
interface ViewArgs {
  mode: 'view'
  boardId: string
  cardId: string
  onCreated: (cardId: string) => void
  onChanged: () => void
}
type Args = CreateArgs | ViewArgs

interface Draft {
  title: string
  description: string
  listId: string | undefined
  priority: Priority
  startDate: string | null
  endDate: string | null
  assigneeIds: string[]
  labelIds: string[]
}

const emptyDraft = (listId?: string): Draft => ({
  title: '',
  description: '',
  listId,
  priority: 'NONE',
  startDate: null,
  endDate: null,
  assigneeIds: [],
  labelIds: [],
})

export function useTaskDraft(args: Args) {
  const [draft, setDraft] = useState<Draft>(() =>
    emptyDraft(args.mode === 'create' ? args.listId : undefined),
  )
  const cardId = args.mode === 'view' ? args.cardId : null
  const cached = cardId ? (readCache<CardDetail>(cardCacheKey(cardId)) ?? null) : null
  const [detail, setDetail] = useState<CardDetail | null>(cached)
  const [loading, setLoading] = useState(args.mode === 'view' && cached === null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (args.mode !== 'view' || !cardId) return
    const controller = new AbortController()
    const seeded = readCache<CardDetail>(cardCacheKey(cardId))
    setDetail(seeded ?? null)
    setLoading(seeded === undefined)
    cardApi
      .get(cardId, controller.signal)
      .then((d) => {
        writeCache(cardCacheKey(cardId), d)
        setDetail(d)
        setLoading(false)
      })
      .catch(() => {
        if (controller.signal.aborted) return
        if (!readCache(cardCacheKey(cardId))) notifyError('Could not load the task.')
        setLoading(false)
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [args.mode, cardId])

  const setField = useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
  }, [])

  const submit = useCallback(async () => {
    if (args.mode !== 'create') return
    if (!draft.title.trim() || !draft.listId) return
    setSaving(true)
    try {
      const input: CreateCardInput = {
        title: draft.title.trim(),
        listId: draft.listId,
        description: draft.description || undefined,
        priority: draft.priority,
        startDate: draft.startDate,
        endDate: draft.endDate,
        assigneeIds: draft.assigneeIds,
        labelIds: draft.labelIds,
      }
      const created = await cardApi.create(args.boardId, input)
      args.onChanged()
      args.onCreated(created.id)
    } catch {
      notifyError('Could not create the task.')
    } finally {
      setSaving(false)
    }
  }, [args, draft])

  const commit = useCallback(
    async (patch: UpdateCardInput) => {
      if (args.mode !== 'view') return
      setSaving(true)
      try {
        const updated = await cardApi.update(args.cardId, patch)
        writeCache(cardCacheKey(args.cardId), updated)
        setDetail(updated)
        args.onChanged()
      } catch {
        notifyError('Could not save your change.')
      } finally {
        setSaving(false)
      }
    },
    [args],
  )

  const addComment = useCallback(
    async (body: string, parentId?: string) => {
      if (args.mode !== 'view') return
      try {
        await cardApi.addComment(args.cardId, body, parentId)
        const fresh = await cardApi.get(args.cardId)
        writeCache(cardCacheKey(args.cardId), fresh)
        setDetail(fresh)
        args.onChanged()
      } catch {
        notifyError('Could not post your comment.')
      }
    },
    [args],
  )

  const editComment = useCallback(
    async (commentId: string, body: string) => {
      if (args.mode !== 'view') return
      try {
        await cardApi.editComment(args.cardId, commentId, body)
        const fresh = await cardApi.get(args.cardId)
        writeCache(cardCacheKey(args.cardId), fresh)
        setDetail(fresh)
        args.onChanged()
      } catch {
        notifyError('Could not update your comment.')
      }
    },
    [args],
  )

  const deleteComment = useCallback(
    async (commentId: string) => {
      if (args.mode !== 'view') return
      try {
        await cardApi.deleteComment(args.cardId, commentId)
        const fresh = await cardApi.get(args.cardId)
        writeCache(cardCacheKey(args.cardId), fresh)
        setDetail(fresh)
        args.onChanged()
      } catch {
        notifyError('Could not delete the comment.')
      }
    },
    [args],
  )

  const reload = useCallback(async () => {
    if (!cardId) return
    try {
      const fresh = await cardApi.get(cardId)
      writeCache(cardCacheKey(cardId), fresh)
      setDetail(fresh)
    } catch {
      /* noop */
    }
  }, [cardId])

  return {
    draft,
    setField,
    detail,
    loading,
    saving,
    submit,
    commit,
    addComment,
    editComment,
    deleteComment,
    reload,
  }
}

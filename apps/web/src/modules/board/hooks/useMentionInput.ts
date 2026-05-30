import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { BoardMember } from '@/shared/types'
import { MENTION } from '../constants'
import { mentionName } from '../utils'

interface MentionRange {
  id: string
  name: string
  start: number
  end: number
}

interface ActiveQuery {
  text: string
  at: number
}

export interface UseMentionInput {
  value: string
  currentUserId?: string
  suggestions: BoardMember[]
  open: boolean
  activeIndex: number
  setActiveIndex: (i: number) => void
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void
  select: (member: BoardMember) => void
  buildBody: () => string
  reset: () => void
  listboxId: string
}

function reconcile(prev: MentionRange[], oldValue: string, newValue: string): MentionRange[] {
  if (oldValue === newValue) return prev
  const oldLen = oldValue.length
  const newLen = newValue.length
  const maxPrefix = Math.min(oldLen, newLen)

  let prefix = 0
  while (prefix < maxPrefix && oldValue[prefix] === newValue[prefix]) prefix++

  let suffix = 0
  while (
    suffix < maxPrefix - prefix &&
    oldValue[oldLen - 1 - suffix] === newValue[newLen - 1 - suffix]
  )
    suffix++

  const changeStart = prefix
  const oldChangeEnd = oldLen - suffix
  const delta = newLen - oldLen

  const next: MentionRange[] = []
  for (const m of prev) {
    if (m.end <= changeStart) next.push(m)
    else if (m.start >= oldChangeEnd)
      next.push({ ...m, start: m.start + delta, end: m.end + delta })
  }
  return next
}

function detectQuery(value: string, caret: number): ActiveQuery | null {
  const match = value.slice(0, caret).match(MENTION.query)
  if (!match) return null
  const text = match[1]
  return { text, at: caret - text.length - 1 }
}

function filterMembers(members: BoardMember[], query: string): BoardMember[] {
  const q = query.toLowerCase()
  return members
    .filter((m) => m.user.name.toLowerCase().includes(q) || m.user.email.toLowerCase().includes(q))
    .slice(0, MENTION.maxSuggestions)
}

export interface MentionInit {
  body: string
  nameById: Map<string, string>
}

function seedFromBody(
  init: MentionInit | undefined,
  currentUserId?: string,
): { value: string; mentions: MentionRange[] } {
  if (!init) return { value: '', mentions: [] }
  let value = ''
  const mentions: MentionRange[] = []
  let cursor = 0
  for (const match of init.body.matchAll(MENTION.token)) {
    const start = match.index ?? 0
    value += init.body.slice(cursor, start)
    const id = match[1]
    const resolved = init.nameById.get(id)
    if (resolved) {
      const label = mentionName(id, resolved, currentUserId)
      const at = value.length
      value += `@${label}`
      mentions.push({ id, name: label, start: at, end: at + 1 + label.length })
    } else {
      value += match[0]
    }
    cursor = start + match[0].length
  }
  value += init.body.slice(cursor)
  return { value, mentions }
}

export function useMentionInput(
  members: BoardMember[],
  currentUserId?: string,
  initial?: MentionInit,
): UseMentionInput {
  const listboxId = useId()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const pendingCaret = useRef<number | null>(null)

  const [value, setValue] = useState(() => seedFromBody(initial, currentUserId).value)
  const [mentions, setMentions] = useState<MentionRange[]>(
    () => seedFromBody(initial, currentUserId).mentions,
  )
  const [query, setQuery] = useState<ActiveQuery | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const suggestions = useMemo(
    () => (query ? filterMembers(members, query.text) : []),
    [members, query],
  )
  const open = query !== null && suggestions.length > 0

  useEffect(() => {
    if (pendingCaret.current === null || !textareaRef.current) return
    const pos = pendingCaret.current
    pendingCaret.current = null
    textareaRef.current.focus()
    textareaRef.current.setSelectionRange(pos, pos)
  })

  const onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    textareaRef.current = e.target
    const newValue = e.target.value
    const caret = e.target.selectionStart ?? newValue.length
    setMentions((prev) => reconcile(prev, value, newValue))
    setValue(newValue)
    setQuery(detectQuery(newValue, caret))
    setActiveIndex(0)
  }

  const select = (member: BoardMember) => {
    if (!query) return
    const { at } = query
    const queryEnd = at + 1 + query.text.length
    const label = mentionName(member.userId, member.user.name, currentUserId)
    const insert = `@${label} `
    const delta = insert.length - (queryEnd - at)
    const range: MentionRange = {
      id: member.userId,
      name: label,
      start: at,
      end: at + 1 + label.length,
    }

    setMentions((prev) =>
      [
        ...prev.map((m) =>
          m.start >= queryEnd ? { ...m, start: m.start + delta, end: m.end + delta } : m,
        ),
        range,
      ].sort((a, b) => a.start - b.start),
    )
    setValue(value.slice(0, at) + insert + value.slice(queryEnd))
    setQuery(null)
    setActiveIndex(0)
    pendingCaret.current = at + insert.length
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!open) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % suggestions.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length)
        break
      case 'Enter':
      case 'Tab':
        e.preventDefault()
        select(suggestions[activeIndex])
        break
      case 'Escape':
        e.preventDefault()
        setQuery(null)
        break
    }
  }

  const buildBody = () => {
    let out = value
    for (const m of [...mentions].sort((a, b) => b.start - a.start)) {
      if (out.slice(m.start, m.end) === `@${m.name}`)
        out = `${out.slice(0, m.start)}@[${m.id}]${out.slice(m.end)}`
    }
    return out
  }

  const reset = () => {
    setValue('')
    setMentions([])
    setQuery(null)
    setActiveIndex(0)
  }

  return {
    value,
    currentUserId,
    suggestions,
    open,
    activeIndex,
    setActiveIndex,
    onChange,
    onKeyDown,
    select,
    buildBody,
    reset,
    listboxId,
  }
}

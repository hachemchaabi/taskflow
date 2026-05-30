import { type ReactNode } from 'react'
import type { CommentMention } from '@/shared/types'
import { cn } from '@/lib/utils'
import { MENTION } from '../constants'
import { mentionName } from '../utils'

interface Props {
  body: string
  mentions: CommentMention[]
  currentUserId?: string
}

export function CommentBody({ body, mentions, currentUserId }: Props) {
  const names = new Map(mentions.map((m) => [m.user.id, m.user.name]))
  const nodes: ReactNode[] = []
  let cursor = 0

  for (const match of body.matchAll(MENTION.token)) {
    const start = match.index ?? 0
    if (start > cursor) nodes.push(body.slice(cursor, start))

    const resolved = names.get(match[1])
    const name = resolved ? mentionName(match[1], resolved, currentUserId) : undefined
    nodes.push(
      <span
        key={start}
        className={cn(
          'rounded-sm px-1 font-medium',
          name ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
        )}
      >
        @{name ?? 'unknown'}
      </span>,
    )
    cursor = start + match[0].length
  }
  if (cursor < body.length) nodes.push(body.slice(cursor))

  return <p className="whitespace-pre-wrap text-sm text-muted-foreground">{nodes}</p>
}

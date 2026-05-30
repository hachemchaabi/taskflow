import { useState } from 'react'
import type { Actor } from '@/shared/realtime/realtimeEvents'
import type { BoardMember, Comment } from '@/shared/types'
import { Icons } from '@/lib/Icons'
import { Icon } from '@/shared/ui/Icon'
import { Button } from '@/shared/ui/button'
import { SUBMIT_SHORTCUT } from '../constants'
import { useMentionInput } from '../hooks/useMentionInput'
import { MentionTextarea } from './MentionTextarea'

interface Props {
  members: BoardMember[]
  currentUserId?: string
  replyTo: Comment | null
  onSubmit: (body: string, parentId: string | null) => Promise<void>
  onCancelReply: () => void
  typingUsers: Actor[]
  onTyping: () => void
}

function typingLabel(users: Actor[]): string {
  if (users.length === 1) return `${users[0].name} is typing…`
  if (users.length === 2) return `${users[0].name} and ${users[1].name} are typing…`
  return 'Several people are typing…'
}

export function CommentComposer({
  members,
  currentUserId,
  replyTo,
  onSubmit,
  onCancelReply,
  typingUsers,
  onTyping,
}: Props) {
  const initial =
    replyTo && members.some((m) => m.userId === replyTo.author.id)
      ? {
          body: `@[${replyTo.author.id}] `,
          nameById: new Map([[replyTo.author.id, replyTo.author.name]]),
        }
      : undefined
  const mention = useMentionInput(members, currentUserId, initial)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    const body = mention.buildBody().trim()
    if (!body) return
    setSubmitting(true)
    try {
      await onSubmit(body, replyTo?.id ?? null)
      mention.reset()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg">
      {replyTo && (
        <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
          <span>
            Replying to <span className="font-medium text-foreground">{replyTo.author.name}</span>
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label="Cancel reply"
            className="cursor-pointer rounded-sm p-0.5 transition hover:bg-accent hover:text-foreground"
          >
            <Icon name={Icons.actions.cancel} size={14} color="currentColor" aria-hidden="true" />
          </button>
        </div>
      )}

      {typingUsers.length > 0 && (
        <p className="mb-1 text-xs text-muted-foreground" aria-live="polite">
          {typingLabel(typingUsers)}
        </p>
      )}

      <div onInput={onTyping}>
        <MentionTextarea
          controller={mention}
          autoFocus={Boolean(replyTo)}
          placeholder={
            replyTo ? 'Write a reply… use @ to mention' : 'Write a comment… use @ to mention'
          }
          onSubmit={() => void submit()}
          footer={
            <Button
              size={replyTo ? 'icon-sm' : 'sm'}
              onClick={() => void submit()}
              loading={submitting}
              disabled={!mention.value.trim()}
              aria-label={replyTo ? 'Send reply' : undefined}
            >
              {replyTo ? (
                <Icon name={Icons.navigation.arrowTurnForward} size={16} aria-hidden="true" />
              ) : (
                <>
                  Publish
                  <kbd className="ms-1.5 font-sans text-xs opacity-70">{SUBMIT_SHORTCUT}</kbd>
                </>
              )}
            </Button>
          }
        />
      </div>
    </div>
  )
}

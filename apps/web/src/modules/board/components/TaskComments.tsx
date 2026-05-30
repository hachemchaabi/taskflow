import { useMemo, useState } from 'react'
import type { Actor } from '@/shared/realtime/realtimeEvents'
import type { BoardMember, Comment } from '@/shared/types'
import { Icons } from '@/lib/Icons'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { useAuth } from '../../auth/hooks/useAuth'
import { useWorkspace } from '../../workspace/hooks/useWorkspace'
import { CommentComposer } from './CommentComposer'
import { CommentItem } from './CommentItem'
import { PanelEmptyState } from './PanelEmptyState'

interface Props {
  comments: Comment[]
  members: BoardMember[]
  onPublish: (body: string, parentId?: string) => Promise<void>
  onEdit: (commentId: string, body: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
  typingUsers: Actor[]
  onTyping: () => void
}

interface Thread {
  root: Comment
  replies: Comment[]
}

function buildThreads(comments: Comment[]): Thread[] {
  const repliesByParent = new Map<string, Comment[]>()
  for (const c of comments) {
    if (!c.parentId) continue
    const list = repliesByParent.get(c.parentId) ?? []
    list.push(c)
    repliesByParent.set(c.parentId, list)
  }
  return comments
    .filter((c) => !c.parentId)
    .map((root) => ({ root, replies: repliesByParent.get(root.id) ?? [] }))
}

export function TaskComments({
  comments,
  members,
  onPublish,
  onEdit,
  onDelete,
  typingUsers,
  onTyping,
}: Props) {
  const { user } = useAuth()
  const { activeWorkspace } = useWorkspace()
  const canModerate = activeWorkspace?.role === 'OWNER' || activeWorkspace?.role === 'ADMIN'
  const [replyTo, setReplyTo] = useState<Comment | null>(null)
  const threads = useMemo(() => buildThreads(comments), [comments])

  const itemProps = { members, currentUserId: user?.id, canModerate, onEdit, onDelete }

  const submit = async (body: string, parentId: string | null) => {
    await onPublish(body, parentId ?? undefined)
    setReplyTo(null)
  }

  return (
    <div className="flex h-full flex-col px-1 pb-1">
      {threads.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <PanelEmptyState
            icon={Icons.communication.chat}
            title="No comments yet"
            hint="Start the conversation, leave the first comment on this task."
          />
        </div>
      ) : (
        <ScrollArea scrollFade scrollbarGutter className="min-h-0 flex-1">
          <ul className="flex flex-col gap-4 pb-4">
            {threads.map(({ root, replies }) => (
              <li key={root.id}>
                <CommentItem comment={root} {...itemProps} onReply={() => setReplyTo(root)} />

                {replies.length > 0 && (
                  <ul className="mt-3 ms-3.5 flex flex-col gap-3 border-s-2 border-border ps-4">
                    {replies.map((r) => (
                      <li key={r.id}>
                        <CommentItem comment={r} {...itemProps} onReply={() => setReplyTo(r)} />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}

      <div className="shrink-0">
        <CommentComposer
          key={replyTo ? `reply-${replyTo.id}` : 'new'}
          members={members}
          currentUserId={user?.id}
          replyTo={replyTo}
          onSubmit={submit}
          onCancelReply={() => setReplyTo(null)}
          typingUsers={typingUsers}
          onTyping={onTyping}
        />
      </div>
    </div>
  )
}

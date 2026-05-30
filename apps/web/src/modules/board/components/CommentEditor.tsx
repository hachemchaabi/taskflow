import { useMemo, useState } from 'react'
import type { BoardMember, Comment } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { SUBMIT_SHORTCUT } from '../constants'
import { useMentionInput } from '../hooks/useMentionInput'
import { MentionTextarea } from './MentionTextarea'

interface Props {
  comment: Comment
  members: BoardMember[]
  currentUserId?: string
  onCancel: () => void
  onSave: (body: string) => Promise<void>
}

export function CommentEditor({ comment, members, currentUserId, onCancel, onSave }: Props) {
  const initial = useMemo(
    () => ({
      body: comment.body,
      nameById: new Map(comment.mentions.map((m) => [m.user.id, m.user.name])),
    }),
    [comment.body, comment.mentions],
  )
  const mention = useMentionInput(members, currentUserId, initial)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    const body = mention.buildBody().trim()
    if (!body) return
    setSaving(true)
    try {
      await onSave(body)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-1">
      <MentionTextarea
        controller={mention}
        placeholder="Edit your comment…"
        onSubmit={() => void save()}
      />

      <div className="mt-2 flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => void save()}
          loading={saving}
          disabled={!mention.value.trim()}
        >
          Save
          <kbd className="ms-1.5 font-sans text-xs opacity-70">{SUBMIT_SHORTCUT}</kbd>
        </Button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import type { BoardMember, Comment } from '@/shared/types'
import { cn } from '@/lib/utils'
import { Icons } from '@/lib/Icons'
import { Icon } from '@/shared/ui/Icon'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button, buttonVariants } from '@/shared/ui/button'
import { Menu, MenuItem, MenuPopup, MenuTrigger } from '@/shared/ui/menu'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import { COMMENT_DELETED_PLACEHOLDER, DELETE_COMMENT_DIALOG } from '../constants'
import { formatTimeAgo, initials } from '../utils'
import { CommentBody } from './CommentBody'
import { CommentEditor } from './CommentEditor'

interface Props {
  comment: Comment
  members: BoardMember[]
  currentUserId?: string
  canModerate: boolean
  onEdit: (commentId: string, body: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
  onReply?: () => void
}

export function CommentItem({
  comment,
  members,
  currentUserId,
  canModerate,
  onEdit,
  onDelete,
  onReply,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const deleted = Boolean(comment.deletedAt)
  const isAuthor = comment.author.id === currentUserId
  const canEdit = isAuthor && !deleted
  const canDelete = (isAuthor || canModerate) && !deleted
  const canReply = Boolean(onReply) && !deleted
  const edited = Boolean(comment.editedAt) && !deleted

  const save = async (body: string) => {
    await onEdit(comment.id, body)
    setEditing(false)
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(comment.id)
      setConfirmOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="group flex gap-3">
      <Avatar className="size-7 rounded-lg text-xs">
        {comment.author.avatarUrl ? (
          <AvatarImage src={comment.author.avatarUrl} alt={comment.author.name} />
        ) : null}

        <AvatarFallback className="rounded-lg">{initials(comment.author.name)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{comment.author.name}</p>
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(comment.editedAt ?? comment.createdAt)}
            {edited ? ' (edited)' : ''}
          </span>

          {(canReply || canEdit || canDelete) && (
            <div className="ms-auto flex items-center gap-0.5">
              {canReply && (
                <button
                  type="button"
                  onClick={onReply}
                  aria-label="Reply"
                  className="cursor-pointer rounded-md px-1.5 py-1 text-xs text-muted-foreground opacity-0 transition hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Icon name={Icons.actions.reply} size={16} aria-hidden="true" />
                </button>
              )}

              {(canEdit || canDelete) && (
                <Menu>
                  <MenuTrigger
                    aria-label="Comment actions"
                    className="cursor-pointer rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-accent focus-visible:opacity-100 group-hover:opacity-100 data-[popup-open]:opacity-100"
                  >
                    <Icon
                      name={Icons.ui.dotsHorizontal}
                      size={16}
                      color="currentColor"
                      aria-hidden="true"
                    />
                  </MenuTrigger>

                  <MenuPopup align="end" className="min-w-32">
                    {canEdit && (
                      <MenuItem className="cursor-pointer" onClick={() => setEditing(true)}>
                        <Icon
                          name={Icons.actions.edit}
                          size={16}
                          color="currentColor"
                          aria-hidden="true"
                        />
                        Edit
                      </MenuItem>
                    )}
                    {canDelete && (
                      <MenuItem
                        className="cursor-pointer"
                        variant="destructive"
                        onClick={() => setConfirmOpen(true)}
                      >
                        <Icon
                          name={Icons.actions.delete}
                          size={16}
                          color="currentColor"
                          aria-hidden="true"
                        />
                        Delete
                      </MenuItem>
                    )}
                  </MenuPopup>
                </Menu>
              )}
            </div>
          )}
        </div>

        {deleted ? (
          <p className="text-sm italic text-muted-foreground">{COMMENT_DELETED_PLACEHOLDER}</p>
        ) : editing ? (
          <CommentEditor
            comment={comment}
            members={members}
            currentUserId={currentUserId}
            onCancel={() => setEditing(false)}
            onSave={save}
          />
        ) : (
          <CommentBody
            body={comment.body}
            mentions={comment.mentions}
            currentUserId={currentUserId}
          />
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{DELETE_COMMENT_DIALOG.title}</AlertDialogTitle>
            <AlertDialogDescription>{DELETE_COMMENT_DIALOG.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose className={cn(buttonVariants({ variant: 'outline' }))}>
              {DELETE_COMMENT_DIALOG.cancel}
            </AlertDialogClose>
            <Button variant="destructive" loading={deleting} onClick={confirmDelete}>
              <Icon name={Icons.actions.delete} size={16} />
              {DELETE_COMMENT_DIALOG.confirm}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

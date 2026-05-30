import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import { Button, buttonVariants } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Icon } from '@/shared/ui/Icon'
import { Icons } from '@/lib/Icons'
import { cn } from '@/lib/utils'
import type { WorkspaceSummary } from '@/shared/types'
import { useWorkspace } from '../hooks/useWorkspace'
import { notifyError, notifySuccess } from '@/shared/utils/notify'
import { WORKSPACE_MESSAGES } from '../constants'
import { PATH } from '../../../shared/routes/paths'

interface DeleteWorkspaceDialogProps {
  workspace: WorkspaceSummary
}

export function DeleteWorkspaceDialog({ workspace }: DeleteWorkspaceDialogProps) {
  const { deleteWorkspace } = useWorkspace()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const matches = confirmText === workspace.name

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) setConfirmText('')
  }

  const onDelete = async () => {
    if (!matches) return
    setDeleting(true)

    try {
      await deleteWorkspace(workspace.id)
      notifySuccess(WORKSPACE_MESSAGES.deleted)
      setOpen(false)
      navigate(PATH.HOME)
    } catch {
      notifyError(WORKSPACE_MESSAGES.deleteError)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger className={cn(buttonVariants({ variant: 'destructive' }), 'w-fit')}>
        <Icon name={Icons.actions.delete} size={16} />
        Delete workspace
      </AlertDialogTrigger>

      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{workspace.name}”?</AlertDialogTitle>

          <AlertDialogDescription>
            This permanently deletes the workspace, its boards, and all memberships. This cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="px-6 pb-2">
          <div className="grid gap-2">
            <Label htmlFor="confirm-name">
              Type <span className="font-medium text-foreground">{workspace.name}</span> to confirm
            </Label>

            <Input
              id="confirm-name"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogClose className={cn(buttonVariants({ variant: 'outline' }))}>
            Cancel
          </AlertDialogClose>

          <Button variant="destructive" onClick={onDelete} loading={deleting} disabled={!matches}>
            <Icon name={Icons.actions.delete} size={16} />
            Delete workspace
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

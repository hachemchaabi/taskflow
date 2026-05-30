import { Icons } from '@/lib/Icons'
import { cn } from '@/lib/utils'
import type { BoardSummary } from '@/shared/types'
import { Button, buttonVariants } from '@/shared/ui/button'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import { Icon } from '@/shared/ui/Icon'
import { DELETE_DIALOG } from '../constants'
import { useDeleteBoard } from '../hooks/useDeleteBoard'

interface Props {
  board: BoardSummary
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged: () => void
}

export function DeleteListDialog({ board, open, onOpenChange, onChanged }: Props) {
  const { deleting, remove } = useDeleteBoard(board.id, onChanged)

  const confirm = async () => {
    const ok = await remove()
    if (ok) onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{DELETE_DIALOG.title}</AlertDialogTitle>
          <AlertDialogDescription>{DELETE_DIALOG.body(board.title)}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose className={cn(buttonVariants({ variant: 'outline' }))}>
            {DELETE_DIALOG.cancel}
          </AlertDialogClose>
          <Button variant="destructive" loading={deleting} onClick={confirm}>
            <Icon name={Icons.actions.delete} size={16} />
            {DELETE_DIALOG.confirm}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

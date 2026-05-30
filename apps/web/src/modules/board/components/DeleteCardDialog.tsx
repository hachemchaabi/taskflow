import { Icons } from '@/lib/Icons'
import { cn } from '@/lib/utils'
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
import { DELETE_TASK_DIALOG } from '../constants'
import { useDeleteCard } from '../hooks/useDeleteCard'

interface Props {
  cardId: string
  cardTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function DeleteCardDialog({ cardId, cardTitle, open, onOpenChange, onDeleted }: Props) {
  const { deleting, remove } = useDeleteCard(cardId, onDeleted)

  const confirm = async () => {
    const ok = await remove()
    if (ok) onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{DELETE_TASK_DIALOG.title}</AlertDialogTitle>
          <AlertDialogDescription>{DELETE_TASK_DIALOG.body(cardTitle)}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose className={cn(buttonVariants({ variant: 'outline' }))}>
            {DELETE_TASK_DIALOG.cancel}
          </AlertDialogClose>
          <Button variant="destructive" loading={deleting} onClick={confirm}>
            <Icon name={Icons.actions.delete} size={16} />
            {DELETE_TASK_DIALOG.confirm}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

import { useState } from 'react'
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
import { Icon } from '@/shared/ui/Icon'
import { Icons } from '@/lib/Icons'
import { cn } from '@/lib/utils'
import type { WorkspaceMember } from '@/shared/types'

interface RemoveMemberDialogProps {
  member: WorkspaceMember
  onConfirm: () => Promise<void>
  disabled?: boolean
}

export function RemoveMemberDialog({ member, onConfirm, disabled }: RemoveMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const [removing, setRemoving] = useState(false)

  const handleRemove = async () => {
    setRemoving(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        className={cn(buttonVariants({ variant: 'destructive', size: 'icon' }))}
        disabled={disabled}
        aria-label={`Remove ${member.user.name}`}
      >
        <Icon name={Icons.actions.delete} size={16} />
      </AlertDialogTrigger>

      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {member.user.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            They’ll lose access to this workspace and its boards. You can invite them again later.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogClose className={cn(buttonVariants({ variant: 'outline' }))}>
            Cancel
          </AlertDialogClose>
          <Button variant="destructive" onClick={handleRemove} loading={removing}>
            <Icon name={Icons.actions.delete} size={16} />
            Remove member
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

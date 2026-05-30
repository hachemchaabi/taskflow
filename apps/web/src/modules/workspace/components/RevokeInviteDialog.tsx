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
import type { WorkspaceInvite } from '@/shared/types'

interface RevokeInviteDialogProps {
  invite: WorkspaceInvite
  onConfirm: () => Promise<void>
  disabled?: boolean
}

export function RevokeInviteDialog({ invite, onConfirm, disabled }: RevokeInviteDialogProps) {
  const [open, setOpen] = useState(false)
  const [revoking, setRevoking] = useState(false)

  const handleRevoke = async () => {
    setRevoking(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setRevoking(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        className={cn(buttonVariants({ variant: 'destructive', size: 'icon' }))}
        disabled={disabled}
        aria-label={`Revoke invitation for ${invite.email}`}
      >
        <Icon name={Icons.actions.delete} size={16} />
      </AlertDialogTrigger>

      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke invitation?</AlertDialogTitle>
          <AlertDialogDescription>
            {invite.email} won’t be able to join with this invite. You can invite them again later.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogClose className={cn(buttonVariants({ variant: 'outline' }))}>
            Cancel
          </AlertDialogClose>
          <Button variant="destructive" onClick={handleRevoke} loading={revoking}>
            <Icon name={Icons.actions.delete} size={16} />
            Revoke invite
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

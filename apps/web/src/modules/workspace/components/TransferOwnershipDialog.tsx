import { useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Button, buttonVariants } from '@/shared/ui/button'
import { RadioGroup, Radio } from '@/shared/ui/radio-group'
import { cn } from '@/lib/utils'
import type { WorkspaceMember } from '@/shared/types'
import { useWorkspace } from '../hooks/useWorkspace'
import { notifyError, notifySuccess } from '@/shared/utils/notify'
import { WORKSPACE_MESSAGES } from '../constants'

interface TransferOwnershipDialogProps {
  workspaceId: string
  candidates: WorkspaceMember[]
  onTransferred: () => void
}

export function TransferOwnershipDialog({
  workspaceId,
  candidates,
  onTransferred,
}: TransferOwnershipDialogProps) {
  const { transferOwnership } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const confirm = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      await transferOwnership(workspaceId, selected)
      notifySuccess(WORKSPACE_MESSAGES.ownershipTransferred)
      setOpen(false)
      setSelected('')
      onTransferred()
    } catch {
      notifyError('Could not transfer ownership.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
        Transfer ownership
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer ownership</DialogTitle>
          <DialogDescription>
            The new owner gains full control of this workspace and you become an admin.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-2">
          {candidates.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Invite another member before transferring ownership.
            </p>
          ) : (
            <RadioGroup value={selected} onValueChange={setSelected}>
              {candidates.map((m) => (
                <label
                  key={m.userId}
                  htmlFor={`owner-${m.userId}`}
                  className="flex items-center gap-3"
                >
                  <Radio id={`owner-${m.userId}`} value={m.userId} />
                  <span>
                    <span className="block text-foreground text-sm">{m.user.name}</span>
                    <span className="block text-muted-foreground text-xs">{m.user.email}</span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          )}
        </div>
        <DialogFooter>
          <DialogClose className={cn(buttonVariants({ variant: 'outline' }))}>Cancel</DialogClose>
          <Button onClick={confirm} loading={submitting} disabled={!selected}>
            Confirm transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

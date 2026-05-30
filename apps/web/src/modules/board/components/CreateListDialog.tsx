import { isAxiosError } from 'axios'
import { type FormEvent, useState } from 'react'
import { Icons } from '@/lib/Icons'
import { cn } from '@/lib/utils'
import type { BoardSummary } from '@/shared/types'
import { Button, buttonVariants } from '@/shared/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Icon } from '@/shared/ui/Icon'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { notifyError } from '@/shared/utils/notify'
import { useWorkspace } from '../../workspace/hooks/useWorkspace'
import { boardsApi } from '../data/boardApi'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (board: BoardSummary) => void
}

export function CreateListDialog({ open, onOpenChange, onCreated }: Props) {
  const { activeWorkspace } = useWorkspace()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const title = name.trim()
    if (!title || !activeWorkspace) return
    setSubmitting(true)
    try {
      const board = await boardsApi.create({ title, workspaceId: activeWorkspace.id })
      onCreated(board)
      setName('')
      onOpenChange(false)
    } catch (err) {
      const serverMessage = isAxiosError<{ error?: string }>(err)
        ? err.response?.data?.error
        : undefined
      notifyError(serverMessage ?? 'Could not create the list.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Create new list</DialogTitle>
            <DialogDescription>
              Give your list a name. You can add cards once it’s created.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-2">
            <div className="grid gap-2">
              <Label htmlFor="create-list-name">List name</Label>
              <Input
                id="create-list-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Website Sprint"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose className={cn(buttonVariants({ variant: 'outline' }))}>Cancel</DialogClose>
            <Button type="submit" loading={submitting} disabled={!name.trim() || !activeWorkspace}>
              <Icon name={Icons.actions.add} size={16} />
              Create list
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

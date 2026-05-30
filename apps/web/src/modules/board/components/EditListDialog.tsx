import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react'
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
import { BOARD_ICON_MIME, EDIT_DIALOG } from '../constants'
import { useRenameBoard } from '../hooks/useRenameBoard'
import { useListIcon } from '../hooks/useListIcon'
import { ListIcon } from './ListIcon'

interface Props {
  board: BoardSummary
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged: () => void
}

export function EditListDialog({ board, open, onOpenChange, onChanged }: Props) {
  const [name, setName] = useState(board.title)
  const { submitting, rename } = useRenameBoard(board.id, onChanged)
  const { busy, upload, remove } = useListIcon(board.id, onChanged)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setName(board.title)
  }, [open, board.title])

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void upload(file)
    e.target.value = ''
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const ok = await rename(name)
    if (ok) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{EDIT_DIALOG.title}</DialogTitle>
            <DialogDescription>{EDIT_DIALOG.description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-6 pb-2">
            <div className="grid gap-2">
              <Label>{EDIT_DIALOG.iconLabel}</Label>
              <div className="flex items-center gap-4">
                <ListIcon board={board} className="size-12 rounded-lg text-base" />
                <div className="flex items-center gap-2">
                  <input
                    id="edit-list-icon-input"
                    ref={inputRef}
                    type="file"
                    accept={BOARD_ICON_MIME.join(',')}
                    className="sr-only"
                    onChange={onFile}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => inputRef.current?.click()}
                  >
                    <Icon name={Icons.file.imageAdd} size={16} />
                    {board.iconUrl ? EDIT_DIALOG.replace : EDIT_DIALOG.upload}
                  </Button>
                  {board.iconUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => void remove()}
                    >
                      <Icon name={Icons.actions.delete} size={16} />
                      {EDIT_DIALOG.remove}
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{EDIT_DIALOG.iconHint}</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-list-name">{EDIT_DIALOG.nameLabel}</Label>
              <Input
                id="edit-list-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose className={cn(buttonVariants({ variant: 'outline' }))}>Cancel</DialogClose>
            <Button
              type="submit"
              loading={submitting}
              disabled={!name.trim() || name.trim() === board.title}
            >
              {EDIT_DIALOG.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

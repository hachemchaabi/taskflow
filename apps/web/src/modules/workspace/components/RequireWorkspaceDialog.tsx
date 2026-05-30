import { useState, type FormEvent } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Icon } from '@/shared/ui/Icon'
import { Icons } from '@/lib/Icons'
import { useAuth } from '../../auth/hooks/useAuth'
import { useWorkspace } from '../hooks/useWorkspace'

export function RequireWorkspaceDialog() {
  const { status: authStatus } = useAuth()
  const { status, workspaces, createWorkspace } = useWorkspace()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const open = authStatus === 'authenticated' && status === 'ready' && workspaces.length === 0

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await createWorkspace(name.trim())
      setName('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={() => {}}>
      <AlertDialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <AlertDialogHeader>
            <AlertDialogTitle>Create your workspace</AlertDialogTitle>
            <AlertDialogDescription>
              You need at least one workspace to use the app. Create one to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2">
            <div className="grid gap-2">
              <Label htmlFor="require-ws-name">Workspace name</Label>
              <Input
                id="require-ws-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Team"
                autoFocus
              />
            </div>
          </div>
          <AlertDialogFooter>
            <Button type="submit" loading={submitting} disabled={!name.trim()}>
              <Icon name={Icons.actions.add} size={16} />
              Create workspace
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

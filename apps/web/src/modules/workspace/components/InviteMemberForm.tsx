import { useState, type FormEvent } from 'react'
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
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Icon } from '@/shared/ui/Icon'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Icons } from '@/lib/Icons'
import { cn } from '@/lib/utils'
import type { MemberRole, WorkspaceInvite } from '@/shared/types'
import { workspacesApi } from '../data/workspaceApi'
import { notifyError } from '@/shared/utils/notify'
import { DEFAULT_ROLE_OPTIONS } from '../constants'

interface Props {
  workspaceId: string
  onInvited: (invite: WorkspaceInvite) => void
}

export function InviteMemberForm({ workspaceId, onInvited }: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>('MEMBER')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const invite = await workspacesApi.createInvite(workspaceId, { email, role })
      onInvited(invite)
      setEmail('')
      setRole('MEMBER')
      setOpen(false)
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status
      notifyError(
        status === 404
          ? 'No account found with that email, they need to sign up first.'
          : status === 409
            ? 'That person is already a member or has a pending invite.'
            : 'Could not send the invite.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants())}>
        <Icon name={Icons.user.add} size={16} />
        Invite member
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Invite a member</DialogTitle>
            <DialogDescription>
              They’ll see the invite in their Inbox the next time they sign in.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-2">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teammate@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as MemberRole)}>
                  <SelectTrigger id="invite-role">
                    <SelectValue>
                      {(value) => DEFAULT_ROLE_OPTIONS.find((o) => o.value === value)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_ROLE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose className={cn(buttonVariants({ variant: 'outline' }))}>Cancel</DialogClose>
            <Button type="submit" loading={submitting} disabled={!email}>
              Send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

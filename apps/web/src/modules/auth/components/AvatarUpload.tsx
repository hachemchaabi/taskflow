import { useRef } from 'react'
import type { ChangeEvent } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { Icon } from '@/shared/ui/Icon'
import { Icons } from '@/lib/Icons'
import type { User } from '@/shared/types'
import { getInitials } from '@/shared/utils/getInitials'
import { useAvatarUpload } from '../hooks/useAvatarUpload'
import { AVATAR_MIME } from '../constants'

interface AvatarUploadProps {
  user: User
}

export function AvatarUpload({ user }: AvatarUploadProps) {
  const { busy, upload, remove } = useAvatarUpload()
  const inputRef = useRef<HTMLInputElement>(null)
  const initials = getInitials(user.name, user.email)

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void upload(file)
    e.target.value = ''
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="profile-avatar-input">Photo</Label>
      <div className="flex items-center gap-4">
        <Avatar className="size-16 rounded-2xl">
          {user.avatarUrl && (
            <AvatarImage
              src={user.avatarUrl}
              alt={`${user.name}'s photo`}
              className="rounded-2xl"
            />
          )}
          <AvatarFallback className="rounded-2xl text-lg">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex items-center gap-2">
          <input
            id="profile-avatar-input"
            ref={inputRef}
            type="file"
            accept={AVATAR_MIME.join(',')}
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
            {user.avatarUrl ? 'Replace' : 'Upload'}
          </Button>

          {user.avatarUrl && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={() => void remove()}
            >
              <Icon name={Icons.actions.delete} size={16} />
              Remove
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">PNG, JPG or SVG, up to 2MB.</p>
    </div>
  )
}

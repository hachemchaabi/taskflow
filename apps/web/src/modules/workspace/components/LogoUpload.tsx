import { useRef } from 'react'
import type { ChangeEvent } from 'react'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { Icon } from '@/shared/ui/Icon'
import { Icons } from '@/lib/Icons'
import type { WorkspaceSummary } from '@/shared/types'
import { useLogoUpload } from '../hooks/useLogoUpload'
import { WORKSPACE_LOGO_MIME } from '../constants'
import { WorkspaceLogo } from './WorkspaceLogo'

interface LogoUploadProps {
  workspace: WorkspaceSummary
  canManage: boolean
}

export function LogoUpload({ workspace, canManage }: LogoUploadProps) {
  const { busy, upload, remove } = useLogoUpload(workspace.id)
  const inputRef = useRef<HTMLInputElement>(null)

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void upload(file)
    e.target.value = ''
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="ws-logo-input">Logo</Label>

      <div className="flex items-center gap-4">
        <WorkspaceLogo
          name={workspace.name}
          logoUrl={workspace.logoUrl}
          className="size-16 text-base"
        />

        {canManage && (
          <div className="flex items-center gap-2">
            <input
              id="ws-logo-input"
              ref={inputRef}
              type="file"
              accept={WORKSPACE_LOGO_MIME.join(',')}
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
              {workspace.logoUrl ? 'Replace' : 'Upload'}
            </Button>

            {workspace.logoUrl && (
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
        )}
      </div>
      <p className="text-xs text-muted-foreground">PNG, JPG or SVG, up to 2MB.</p>
    </div>
  )
}

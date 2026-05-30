import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { Label } from '@/shared/ui/label'
import { cn } from '@/lib/utils'
import { Icons } from '@/lib/Icons'
import type { WorkspaceSummary } from '@/shared/types'
import { useGeneralSettings } from '../hooks/useGeneralSettings'
import { LogoUpload } from './LogoUpload'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { WORKSPACE_DESCRIPTION_MAX } from '../constants'

interface GeneralSectionProps {
  workspace: WorkspaceSummary
  canManage: boolean
}

export function GeneralSection({ workspace, canManage }: GeneralSectionProps) {
  const form = useGeneralSettings(workspace)

  return (
    <Card className="space-y-4 p-6">
      <SectionHeader
        icon={Icons.ui.building}
        title="General"
        description="Your workspace’s name and description."
      />

      <div className="grid max-w-md gap-2">
        <Label htmlFor="ws-name">Name</Label>

        <Input
          id="ws-name"
          value={form.name}
          onChange={(e) => form.setName(e.target.value)}
          onBlur={form.validateName}
          disabled={!canManage}
          aria-invalid={form.nameError ? true : undefined}
          aria-describedby={form.nameError ? 'ws-name-error' : undefined}
        />

        {form.nameError && (
          <p id="ws-name-error" className="text-xs text-destructive">
            {form.nameError}
          </p>
        )}
      </div>

      <LogoUpload workspace={workspace} canManage={canManage} />

      <div className="grid max-w-md gap-2">
        <Label htmlFor="ws-description">Description</Label>

        <Textarea
          id="ws-description"
          value={form.description}
          onChange={(e) => form.setDescription(e.target.value)}
          disabled={!canManage}
          maxLength={WORKSPACE_DESCRIPTION_MAX}
          aria-describedby="ws-description-count"
        />

        <p
          id="ws-description-count"
          className={cn(
            'text-xs text-muted-foreground',
            !form.descriptionValid && 'text-destructive',
          )}
        >
          {form.descriptionRemaining} characters left
        </p>
      </div>

      {canManage && (
        <div className="flex justify-end">
          <Button onClick={() => void form.save()} disabled={!form.canSave}>
            {form.saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      )}
    </Card>
  )
}

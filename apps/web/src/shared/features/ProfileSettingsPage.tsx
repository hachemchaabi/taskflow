import { useState } from 'react'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { ThemeSwitcher } from '@/modules/theme/components/ThemeSwitcher'
import { AvatarUpload } from '@/modules/auth/components/AvatarUpload'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { useProfileForm } from '@/modules/auth/hooks/useProfileForm'
import { Icons } from '@/lib/Icons'
import { Icon } from '../ui/Icon'

export default function ProfileSettingsPage() {
  const { user, logout } = useAuth()
  const form = useProfileForm()
  const [signingOut, setSigningOut] = useState(false)

  const handleLogout = async () => {
    setSigningOut(true)
    try {
      await logout()
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold text-slate-text">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account details and preferences.
        </p>
      </header>

      <Card className="space-y-4 p-6">
        <SectionHeader
          icon={Icons.user.profile}
          title="Account"
          description="Your personal account details."
        />

        {user && <AvatarUpload user={user} />}

        <div className="grid max-w-md gap-2">
          <Label htmlFor="profile-name">Name</Label>
          <Input
            id="profile-name"
            value={form.name}
            onChange={(e) => form.setName(e.target.value)}
            onBlur={form.validateName}
            aria-invalid={form.nameError ? true : undefined}
            aria-describedby={form.nameError ? 'profile-name-error' : undefined}
          />
          {form.nameError && (
            <p id="profile-name-error" className="text-xs text-destructive">
              {form.nameError}
            </p>
          )}
        </div>

        <div className="grid max-w-md gap-2">
          <Label htmlFor="profile-email">Email</Label>
          <Input
            id="profile-email"
            type="email"
            value={user?.email ?? ''}
            disabled
            aria-describedby="profile-email-hint"
          />
          <p id="profile-email-hint" className="text-xs text-muted-foreground">
            Your email address can’t be changed.
          </p>
        </div>

        <div className="flex justify-end">
          <Button loading={form.saving} disabled={!form.canSave} onClick={() => void form.save()}>
            Save changes
          </Button>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <SectionHeader
          icon={Icons.ui.moon}
          title="Appearance"
          description="Choose how the app looks on this device."
        />
        <div className="max-w-md">
          <ThemeSwitcher />
        </div>
      </Card>

      <Card className="space-y-4 border-destructive p-6">
        <SectionHeader
          tone="danger"
          icon={Icons.user.logout}
          title="Session"
          description="Sign out of your account on this device."
        />
        <div className="flex justify-end">
          <Button variant="destructive" loading={signingOut} onClick={() => void handleLogout()}>
            <Icon name={Icons.user.logout} size={16} />
            Log out
          </Button>
        </div>
      </Card>
    </section>
  )
}

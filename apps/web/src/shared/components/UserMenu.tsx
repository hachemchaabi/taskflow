import { useNavigate } from 'react-router-dom'
import { Icon } from '@/shared/ui/Icon'
import { Icons } from '@/lib/Icons'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from '@/shared/ui/menu'
import { buttonVariants } from '@/shared/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '../../modules/auth/hooks/useAuth'
import { ThemeSwitcher } from '../../modules/theme/components/ThemeSwitcher'
import { getInitials } from '@/shared/utils/getInitials'

export function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const initials = getInitials(user?.name, user?.email)

  return (
    <Menu>
      <MenuTrigger
        aria-label="Account menu"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'data-[popup-open]:bg-accent',
        )}
      >
        <Avatar className="size-7 rounded-lg">
          {user?.avatarUrl && (
            <AvatarImage src={user.avatarUrl} alt={user.name} className="rounded-lg" />
          )}
          <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
        </Avatar>
      </MenuTrigger>
      <MenuPopup side="bottom" align="end" sideOffset={4} className="min-w-56">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Avatar className="size-8 rounded-lg">
            {user?.avatarUrl && (
              <AvatarImage src={user.avatarUrl} alt={user.name} className="rounded-lg" />
            )}
            <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user?.name}</span>
            <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
          </div>
        </div>
        <MenuSeparator />
        <div className="px-2 py-1.5">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Theme</p>
          <ThemeSwitcher />
        </div>
        <MenuSeparator />
        <MenuItem
          className="cursor-pointer rounded-lg"
          onClick={() => navigate('/settings/profile')}
        >
          <Icon name={Icons.user.profile} size={16} />
          Profile
        </MenuItem>
        <MenuItem
          className="cursor-pointer rounded-lg"
          onClick={() => navigate('/settings/workspace')}
        >
          <Icon name={Icons.navigation.settings} size={16} />
          Settings
        </MenuItem>
        <MenuSeparator />
        <MenuItem variant="destructive" className="cursor-pointer rounded-lg" onClick={logout}>
          <Icon name={Icons.user.logout} size={16} />
          Log out
        </MenuItem>
      </MenuPopup>
    </Menu>
  )
}

import { useNavigate } from 'react-router-dom'
import { Icon } from '@/shared/ui/Icon'
import { Icons } from '@/lib/Icons'
import { Skeleton } from '@/shared/ui/skeleton'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/shared/ui/sidebar'
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from '@/shared/ui/menu'
import { useWorkspace } from '../hooks/useWorkspace'
import { WorkspaceLogo } from './WorkspaceLogo'

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, switchWorkspace, status } = useWorkspace()
  const navigate = useNavigate()
  const isLoading = status === 'idle' || status === 'loading'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Menu>
          <MenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                tooltip={activeWorkspace?.name ?? 'Workspace'}
                className="cursor-pointer data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-accent-foreground"
              />
            }
          >
            {activeWorkspace ? (
              <WorkspaceLogo
                name={activeWorkspace.name}
                logoUrl={activeWorkspace.logoUrl}
                className="size-8"
              />
            ) : (
              <Skeleton className="size-8 rounded-md" />
            )}

            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              {activeWorkspace ? (
                <>
                  <span className="truncate font-medium">{activeWorkspace.name}</span>
                  <span className="truncate text-xs capitalize">
                    {activeWorkspace.role.toLowerCase()}
                  </span>
                </>
              ) : isLoading ? (
                <>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-1 h-3 w-12" />
                </>
              ) : (
                <span className="truncate font-medium">No workspace</span>
              )}
            </div>

            <Icon
              name={Icons.ui.unfold}
              size={16}
              className="ml-auto group-data-[collapsible=icon]:hidden"
            />
          </MenuTrigger>

          <MenuPopup side="top" align="start" sideOffset={4} className="w-60">
            {workspaces.map((ws) => (
              <MenuItem
                key={ws.id}
                className="cursor-pointer rounded-lg"
                onClick={() => switchWorkspace(ws.id)}
              >
                <WorkspaceLogo name={ws.name} logoUrl={ws.logoUrl} className="size-6 text-[10px]" />
                <span className="min-w-0 flex-1 truncate">{ws.name}</span>
                {ws.id === activeWorkspace?.id && <Icon name={Icons.actions.save} size={16} />}
              </MenuItem>
            ))}

            <MenuSeparator />

            <MenuItem
              className="cursor-pointer rounded-lg"
              onClick={() => navigate('/settings/workspace')}
            >
              <Icon name={Icons.actions.add} size={16} />
              Manage workspaces
            </MenuItem>
          </MenuPopup>
        </Menu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

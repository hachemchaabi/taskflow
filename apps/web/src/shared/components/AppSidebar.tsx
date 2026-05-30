import { type ComponentProps, useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '@/shared/ui/Icon'
import { Icons } from '@/lib/Icons'
import BrandLogo from '@/shared/assets/brand-logo.svg?react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/shared/ui/sidebar'
import { Badge } from '@/shared/ui/badge'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/shared/ui/empty'
import { cn } from '@/lib/utils'
import { useAuth } from '../../modules/auth/hooks/useAuth'
import { useFetch, invalidateCache } from '../hooks/useFetch'
import { boardsApi } from '../../modules/board/data/boardApi'
import { useRealtime } from '../realtime/useRealtime'
import { REALTIME_EVENTS } from '../realtime/realtimeEvents'
import { WorkspaceSwitcher } from '../../modules/workspace/components/WorkspaceSwitcher'
import { useWorkspace } from '../../modules/workspace/hooks/useWorkspace'
import { useNotifications } from '../../modules/notification/hooks/useNotifications'
import { CreateListDialog } from '../../modules/board/components/CreateListDialog'
import { BoardSidebarItem } from '../../modules/board/components/BoardSidebarItem'
import { navButtonClass } from './sidebarNavClass'

const essentialItems = [
  { title: 'Home', to: '/', icon: Icons.navigation.home },
  { title: 'Inbox', to: '/inbox', icon: Icons.navigation.inbox },
] as const

const settingsBackItem = {
  title: 'Exit settings',
  to: '/',
  icon: Icons.navigation.arrowLeft,
} as const

const settingsGroups = [
  {
    label: 'Account',
    items: [
      { title: 'Profile', to: '/settings/profile', icon: Icons.user.profile },
      {
        title: 'Notifications',
        to: '/settings/notifications',
        icon: Icons.communication.notification,
      },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { title: 'Workspace', to: '/settings/workspace', icon: Icons.ui.building },
      { title: 'Members', to: '/settings/members', icon: Icons.user.users },
    ],
  },
] as const

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const { status } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { activeWorkspace } = useWorkspace()
  const { unreadCount } = useNotifications()
  const inSettings = pathname.startsWith('/settings')
  const [createOpen, setCreateOpen] = useState(false)

  const { data: boards, refetch: refetchBoards } = useFetch(
    (signal) => boardsApi.list(activeWorkspace!.id, signal),
    [activeWorkspace?.id],
    {
      enabled: status === 'authenticated' && !!activeWorkspace,
      cacheKey: `boards:${activeWorkspace?.id}`,
    },
  )

  const { subscribe } = useRealtime()
  const activeWorkspaceId = activeWorkspace?.id

  useEffect(() => {
    if (!activeWorkspaceId) return

    return subscribe(REALTIME_EVENTS.boardsChanged, () => {
      invalidateCache(`boards:${activeWorkspaceId}`)
      refetchBoards()
    })
  }, [activeWorkspaceId, subscribe, refetchBoards])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link to="/" aria-label="TaskFlow" />}
              className="hover:bg-transparent active:bg-transparent data-[active=true]:bg-transparent"
            >
              <BrandLogo className="size-auto h-6 w-auto group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="h-full">
        {inSettings ? (
          <>
            <SidebarGroup className="shrink-0">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={settingsBackItem.title}
                    className={navButtonClass}
                    render={<NavLink to={settingsBackItem.to} end />}
                  >
                    <Icon name={settingsBackItem.icon} size={18} color="currentColor" />
                    <span>{settingsBackItem.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            {settingsGroups.map((group) => (
              <SidebarGroup key={group.label} className="shrink-0">
                <SidebarGroupLabel className="text-muted-foreground">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={pathname === item.to}
                        tooltip={item.title}
                        className={navButtonClass}
                        render={<NavLink to={item.to} end />}
                      >
                        <Icon name={item.icon} size={18} color="currentColor" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </>
        ) : (
          <SidebarGroup className="shrink-0">
            <SidebarGroupLabel className="text-muted-foreground">Essentials</SidebarGroupLabel>
            <SidebarMenu>
              {essentialItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={pathname === item.to}
                    tooltip={item.title}
                    className={navButtonClass}
                    render={<NavLink to={item.to} end />}
                  >
                    <Icon name={item.icon} size={18} color="currentColor" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                  {item.to === '/inbox' && unreadCount > 0 && (
                    <Badge
                      size="sm"
                      className="pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 tabular-nums group-data-[collapsible=icon]:hidden"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {!inSettings && (
          <SidebarGroup className="flex min-h-0 flex-1 flex-col">
            <SidebarGroupLabel className="text-muted-foreground">Lists</SidebarGroupLabel>
            <SidebarGroupContent className="flex min-h-0 flex-1 flex-col">
              <ScrollArea
                scrollFade
                className="h-auto min-h-0 shrink [&_[data-slot=scroll-area-scrollbar][data-orientation=vertical]]:!flex"
              >
                {boards?.length === 0 ? (
                  <Empty className="gap-0 px-2 py-6 group-data-[collapsible=icon]:hidden">
                    <EmptyMedia variant="icon">
                      <Icon name={Icons.file.clipboard} size={18} aria-hidden="true" />
                    </EmptyMedia>
                    <EmptyTitle className="text-sm">No lists yet</EmptyTitle>
                    <EmptyDescription className="text-xs">
                      Create your first list to start organizing tasks.
                    </EmptyDescription>
                  </Empty>
                ) : (
                  <SidebarMenu>
                    {boards?.map((board) => (
                      <BoardSidebarItem
                        key={board.id}
                        board={board}
                        isActive={pathname === `/boards/${board.id}`}
                        onChanged={refetchBoards}
                      />
                    ))}
                  </SidebarMenu>
                )}
              </ScrollArea>
              <SidebarMenu className="mt-1 shrink-0">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setCreateOpen(true)}
                    tooltip="Create new list"
                    className={cn(navButtonClass, 'cursor-pointer')}
                  >
                    <Icon name={Icons.actions.add} size={18} color="currentColor" />
                    <span>Create new list</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <CreateListDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(board) => {
          refetchBoards()
          navigate(`/boards/${board.id}`)
        }}
      />

      <SidebarFooter>
        <WorkspaceSwitcher />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

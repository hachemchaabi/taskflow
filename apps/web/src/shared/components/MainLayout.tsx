import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/shared/ui/sidebar'
import { Separator } from '@/shared/ui/separator'
import { cn } from '@/lib/utils'
import { AppSidebar } from './AppSidebar'
import { BreadcrumbLabelProvider } from './BreadcrumbLabelContext'
import { Breadcrumbs } from './Breadcrumbs'
import { UserMenu } from './UserMenu'
import { RequireWorkspaceDialog } from '../../modules/workspace/components/RequireWorkspaceDialog'

export function MainLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const fillHeight = /^\/boards\/[^/]+/.test(pathname)

  return (
    <BreadcrumbLabelProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <header className="flex h-12 items-center gap-1 border-b border-stone-border px-3">
            <SidebarTrigger className="-ms-1" />
            <Separator orientation="vertical" className="me-2 h-4" />
            <Breadcrumbs />
            <div className="ms-auto">
              <UserMenu />
            </div>
          </header>
          <main
            className={cn(
              'mx-auto w-full max-w-6xl px-4',
              fillHeight ? 'flex min-h-0 min-w-0 flex-1 flex-col py-6' : 'py-8',
            )}
          >
            {children}
          </main>
        </SidebarInset>
        <RequireWorkspaceDialog />
      </SidebarProvider>
    </BreadcrumbLabelProvider>
  )
}

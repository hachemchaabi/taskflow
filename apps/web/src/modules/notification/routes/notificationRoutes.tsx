import { lazy } from 'react'
import type { RouteConfig } from '../../../shared/routes'
import { PATH } from './paths'
import AuthGuard from '../../../shared/guards/AuthGuard'
import { MainLayout } from '../../../shared/components/MainLayout'

const NotificationPreferencesPage = lazy(() => import('../features/NotificationPreferencesPage'))

const routes: RouteConfig[] = [
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.SETTINGS_NOTIFICATIONS,
    component: NotificationPreferencesPage,
    layout: MainLayout,
  },
]

export default routes

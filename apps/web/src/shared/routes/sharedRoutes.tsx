import { lazy } from 'react'
import type { RouteConfig } from './index'
import { PATH } from './paths'
import AuthGuard from '../guards/AuthGuard'
import { MainLayout } from '../components/MainLayout'

const DashboardPage = lazy(() => import('@/modules/dashboard/features/DashboardPage'))
const NotFoundPage = lazy(() => import('../features/NotFoundPage'))

const routes: RouteConfig[] = [
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.HOME,
    component: DashboardPage,
    layout: MainLayout,
  },
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.All,
    component: NotFoundPage,
    layout: MainLayout,
  },
]

export default routes

import { lazy } from 'react'
import type { RouteConfig } from '../../../shared/routes'
import { PATH } from './paths'
import AuthGuard from '../../../shared/guards/AuthGuard'
import { MainLayout } from '../../../shared/components/MainLayout'

const BoardPage = lazy(() => import('../features/BoardPage'))

const routes: RouteConfig[] = [
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.BOARD_DETAIL,
    component: BoardPage,
    layout: MainLayout,
  },
]

export default routes

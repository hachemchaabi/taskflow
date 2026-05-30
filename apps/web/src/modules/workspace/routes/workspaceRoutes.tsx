import { lazy } from 'react'
import type { RouteConfig } from '../../../shared/routes'
import { PATH } from './paths'
import AuthGuard from '../../../shared/guards/AuthGuard'
import { MainLayout } from '../../../shared/components/MainLayout'

const WorkspaceSettingsPage = lazy(() => import('../features/WorkspaceSettingsPage'))
const MembersSettingsPage = lazy(() => import('../features/MembersSettingsPage'))
const ProfileSettingsPage = lazy(() => import('../../../shared/features/ProfileSettingsPage'))
const InboxPage = lazy(() => import('../../../shared/features/InboxPage'))

const routes: RouteConfig[] = [
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.SETTINGS_PROFILE,
    component: ProfileSettingsPage,
    layout: MainLayout,
  },
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.SETTINGS_WORKSPACE,
    component: WorkspaceSettingsPage,
    layout: MainLayout,
  },
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.SETTINGS_MEMBERS,
    component: MembersSettingsPage,
    layout: MainLayout,
  },
  {
    exact: true,
    guard: AuthGuard,
    path: PATH.INBOX,
    component: InboxPage,
    layout: MainLayout,
  },
]

export default routes

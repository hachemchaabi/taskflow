import { lazy } from 'react'
import type { RouteConfig } from '../../../shared/routes'
import { PATH } from './paths'
import GuestGuard from '../../../shared/guards/GuestGuard'
import { AuthLayout } from '../../../shared/components/AuthLayout'

const LoginPage = lazy(() => import('../features/LoginPage'))
const SignupPage = lazy(() => import('../features/SignupPage'))

const routes: RouteConfig[] = [
  {
    exact: true,
    guard: GuestGuard,
    path: PATH.LOGIN,
    component: LoginPage,
    layout: AuthLayout,
  },
  {
    exact: true,
    guard: GuestGuard,
    path: PATH.SIGNUP,
    component: SignupPage,
    layout: AuthLayout,
  },
]

export default routes

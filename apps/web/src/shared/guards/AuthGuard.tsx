import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../modules/auth/hooks/useAuth'
import { FullPageLoader } from '../components/FullPageLoader'

const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { user, status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <FullPageLoader />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}

export default AuthGuard

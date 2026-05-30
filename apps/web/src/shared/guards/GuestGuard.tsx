import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../modules/auth/hooks/useAuth'
import { FullPageLoader } from '../components/FullPageLoader'

const GuestGuard = ({ children }: { children: ReactNode }) => {
  const { user, status } = useAuth()

  if (status === 'loading') {
    return <FullPageLoader />
  }

  return user ? <Navigate to="/" replace /> : <>{children}</>
}

export default GuestGuard

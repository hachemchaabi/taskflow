import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LoginForm } from '../components/LoginForm'

interface LocationState {
  from?: { pathname: string }
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)

  const from = (location.state as LocationState | null)?.from?.pathname ?? '/'

  const handleLogin = async (email: string, password: string) => {
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch {
      /* noop */
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <LoginForm onLogin={handleLogin} loading={loading} />
    </div>
  )
}

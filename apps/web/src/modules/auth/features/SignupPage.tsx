import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { SignupForm } from '../components/SignupForm'

export default function SignupPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSignup = async (name: string, email: string, password: string) => {
    setLoading(true)
    try {
      await register(name, email, password)
      navigate('/', { replace: true })
    } catch {
      /* noop */
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <SignupForm onSignup={handleSignup} loading={loading} />
    </div>
  )
}

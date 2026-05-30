import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/shared/ui/Icon'
import { Icons } from '@/lib/Icons'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { isNonEmpty, isValidEmail, isValidPassword } from '../../../shared/utils/validators'

interface SignupFormProps extends React.ComponentProps<typeof Card> {
  onSignup: (name: string, email: string, password: string) => void
  loading?: boolean
}

export function SignupForm({ onSignup, loading, ...props }: SignupFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isNonEmpty(name)) {
      setValidationError('Please enter your name.')
      return
    }
    if (!isValidEmail(email)) {
      setValidationError('Please enter a valid email address.')
      return
    }
    if (!isValidPassword(password)) {
      setValidationError('Password must be at least 8 characters long.')
      return
    }
    if (password !== confirm) {
      setValidationError('Passwords do not match.')
      return
    }
    setValidationError(null)
    onSignup(name.trim(), email, password)
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Enter your information below to create your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <FieldDescription>
                We&apos;ll use this to contact you. We will not share your email with anyone else.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="[&_input]:pr-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <Icon name={Icons.ui.eyeOff} className="size-4" />
                  ) : (
                    <Icon name={Icons.ui.eye} className="size-4" />
                  )}
                </button>
              </div>
              <FieldDescription>Must be at least 8 characters long.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  className="[&_input]:pr-9"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  aria-pressed={showConfirm}
                >
                  {showConfirm ? (
                    <Icon name={Icons.ui.eyeOff} className="size-4" />
                  ) : (
                    <Icon name={Icons.ui.eye} className="size-4" />
                  )}
                </button>
              </div>
              {validationError ? (
                <FieldDescription className="text-destructive" role="alert">
                  {validationError}
                </FieldDescription>
              ) : (
                <FieldDescription>Please confirm your password.</FieldDescription>
              )}
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit" loading={loading}>
                  Create Account
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account? <Link to="/login">Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

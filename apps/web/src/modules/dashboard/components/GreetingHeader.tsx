import { useAuth } from '@/modules/auth/hooks/useAuth'
import { useWorkspace } from '@/modules/workspace/hooks/useWorkspace'
import { greetingFor, firstName } from '../utils'

export function GreetingHeader() {
  const { user } = useAuth()
  const { activeWorkspace } = useWorkspace()

  if (!user) return null

  return (
    <header>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {greetingFor(new Date())}, {firstName(user.name)}
      </h1>
      {activeWorkspace ? (
        <p className="text-sm text-muted-foreground">
          Here&rsquo;s what&rsquo;s happening in {activeWorkspace.name}.
        </p>
      ) : null}
    </header>
  )
}

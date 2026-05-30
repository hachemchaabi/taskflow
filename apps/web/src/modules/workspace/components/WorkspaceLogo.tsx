import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { cn } from '@/lib/utils'

interface WorkspaceLogoProps {
  name: string
  logoUrl?: string | null
  className?: string
}

export function WorkspaceLogo({ name, logoUrl, className }: WorkspaceLogoProps) {
  const initial = name.trim().charAt(0).toUpperCase() || 'W'

  return (
    <Avatar key={logoUrl ?? 'fallback'} className={cn('rounded-md', className)}>
      {logoUrl && <AvatarImage src={logoUrl} alt={`${name} logo`} className="rounded-md" />}

      <AvatarFallback className="rounded-md">{initial}</AvatarFallback>
    </Avatar>
  )
}

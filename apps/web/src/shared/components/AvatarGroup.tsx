import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { cn } from '@/lib/utils'
import { initials } from '@/modules/board/utils'

interface AvatarGroupItem {
  id: string
  name: string
  avatarUrl?: string | null
}

interface AvatarGroupProps {
  members: AvatarGroupItem[]
  max?: number
  className?: string
  size?: number
  fontClassName?: string
  radiusClassName?: string
}

export function AvatarGroup({
  members,
  max = 3,
  className,
  size = 24,
  fontClassName = 'text-xs',
  radiusClassName = 'rounded-md',
}: AvatarGroupProps) {
  const shown = members.slice(0, max)
  const overflow = members.length - shown.length

  return (
    <div className={cn('flex items-center -space-x-2', className)}>
      {shown.map((m) => (
        <Avatar
          key={m.id}
          className={cn('ring-2 ring-background', radiusClassName, fontClassName)}
          style={{ width: size, height: size }}
        >
          {m.avatarUrl ? <AvatarImage src={m.avatarUrl} alt={m.name} /> : null}
          <AvatarFallback className={radiusClassName}>{initials(m.name)}</AvatarFallback>
        </Avatar>
      ))}

      {overflow > 0 && (
        <span
          className={cn(
            'z-10 inline-flex items-center justify-center bg-secondary font-medium text-muted-foreground ring-2 ring-background',
            radiusClassName,
            fontClassName,
          )}
          style={{ width: size, height: size }}
        >
          +{overflow}
        </span>
      )}
    </div>
  )
}

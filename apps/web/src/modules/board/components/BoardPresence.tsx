import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip'
import { getInitials } from '@/shared/utils/getInitials'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import type { PresenceUser } from '@/shared/realtime/realtimeEvents'

const MAX_VISIBLE = 5
const OPEN_DELAY_MS = 150

function activityPhrase(user: PresenceUser): string {
  const { context } = user
  if (context.type === 'card' && context.cardTitle) {
    return `${context.editing ? 'editing' : 'viewing'} “${context.cardTitle}”`
  }
  return 'viewing this board'
}

export function BoardPresence({ users }: { users: PresenceUser[] }) {
  const { user: currentUser } = useAuth()
  const others = users.filter((u) => u.id !== currentUser?.id)
  if (others.length === 0) return null
  const visible = others.slice(0, MAX_VISIBLE)
  const overflow = others.length - visible.length

  return (
    <TooltipProvider delay={OPEN_DELAY_MS}>
      <div className="flex items-center -space-x-2" aria-label="Members viewing this board">
        {visible.map((user) => (
          <Tooltip key={user.id}>
            <TooltipTrigger
              render={
                <span className="relative inline-flex rounded-lg ring-2 ring-background">
                  <Avatar className="size-7 rounded-md">
                    {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}

                    <AvatarFallback className="rounded-md text-xs">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </span>
              }
            />

            <TooltipContent side="top" sideOffset={8} className="max-w-60">
              <span className="font-semibold text-popover-foreground">{user.name}</span>{' '}
              {activityPhrase(user)}
            </TooltipContent>
          </Tooltip>
        ))}

        {overflow > 0 && (
          <span className="relative inline-flex size-7 items-center justify-center rounded-lg bg-muted text-[10px] text-muted-foreground ring-2 ring-background">
            +{overflow}
          </span>
        )}
      </div>
    </TooltipProvider>
  )
}

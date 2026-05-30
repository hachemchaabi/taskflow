import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { cn } from '@/lib/utils'
import type { BoardSummary } from '@/shared/types'

interface Props {
  board: Pick<BoardSummary, 'id' | 'title' | 'iconUrl'>
  className?: string
}

export function ListIcon({ board, className }: Props) {
  const initial = board.title.trim().charAt(0).toUpperCase() || 'L'

  return (
    <Avatar className={cn('size-5 rounded-md border border-border', className)}>
      {board.iconUrl && <AvatarImage src={board.iconUrl} alt="" className="rounded-md" />}

      <AvatarFallback className="rounded-md font-medium">
        {initial}
      </AvatarFallback>
    </Avatar>
  )
}

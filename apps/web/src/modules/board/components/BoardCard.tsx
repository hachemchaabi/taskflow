import { useState } from 'react'
import { Icons } from '@/lib/Icons'
import type { Card } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/Icon'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip'
import { AvatarGroup } from '@/shared/components/AvatarGroup'
import { CARD_META, PRIORITY_META } from '../constants'
import { formatDateRange } from '../utils'
import { DeleteCardDialog } from './DeleteCardDialog'
import { LabelBadgeList } from './LabelBadge'

interface Props {
  card: Card
  onOpen?: () => void
  onChanged: () => void
}

export function BoardCard({ card, onOpen, onChanged }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const comments = card._count?.comments ?? 0
  const range = formatDateRange(card.startDate, card.endDate)
  const hasLabels = card.labels.length > 0
  const hasAssignees = card.assignees.length > 0
  const priority = PRIORITY_META[card.priority]

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen?.()
        }
      }}
      className="group relative flex flex-col gap-2 rounded-md text-start outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Button
        variant="destructive"
        size="icon-xs"
        aria-label="Delete task"
        onClick={(e) => {
          e.stopPropagation()
          setConfirmOpen(true)
        }}
        onKeyDown={(e) => e.stopPropagation()}
        className="absolute end-0 top-0 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <Icon name={Icons.actions.delete} size={16} aria-hidden="true" />
      </Button>

      {hasLabels ? (
        <LabelBadgeList labels={card.labels} />
      ) : (
        <span className="inline-flex items-center gap-1 pe-6 text-xs text-muted-foreground">
          <Icon name={Icons.ui.tag} size={14} aria-hidden="true" />
          {CARD_META.noLabels}
        </span>
      )}

      <p className="pe-6 text-sm font-medium leading-snug text-foreground">{card.title}</p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <TooltipProvider delay={300}>
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="inline-flex" aria-label={priority.name}>
                  <Icon
                    name={Icons.ui.flag}
                    size={14}
                    color="currentColor"
                    className={priority.iconClass}
                    aria-hidden="true"
                  />
                </span>
              }
            />
            <TooltipContent side="top" sideOffset={6}>
              {priority.name}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <span className="inline-flex items-center gap-1">
          <Icon name={Icons.ui.calendar} size={14} aria-hidden="true" />
          {range ?? CARD_META.noDueDate}
        </span>

        {hasAssignees ? (
          <AvatarGroup
            members={card.assignees}
            size={20}
            fontClassName="text-[10px]"
            radiusClassName="rounded-md"
          />
        ) : (
          <span className="inline-flex items-center gap-1">
            <Icon name={Icons.user.user} size={14} aria-hidden="true" />
            {CARD_META.unassigned}
          </span>
        )}

        <span className="inline-flex items-center gap-1">
          <Icon name={Icons.communication.message} size={14} aria-hidden="true" />
          {comments}
        </span>
      </div>

      <span
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <DeleteCardDialog
          cardId={card.id}
          cardTitle={card.title}
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onDeleted={onChanged}
        />
      </span>
    </div>
  )
}

import { useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { Icon } from '@/shared/ui/Icon'
import { Icons } from '@/lib/Icons'
import { Calendar } from '@/shared/ui/calendar'
import { Popover, PopoverTrigger, PopoverPopup } from '@/shared/ui/popover'
import { fieldTriggerVariants, fieldTriggerChevronClassName } from '@/shared/ui/select'
import { formatDateRange } from '../utils'

interface Props {
  start: string | null
  end: string | null
  onChange: (start: string | null, end: string | null) => void
}

export function TaskTimelineField({ start, end, onChange }: Props) {
  const [range, setRange] = useState<DateRange | undefined>({
    from: start ? new Date(start) : undefined,
    to: end ? new Date(end) : undefined,
  })
  const label = formatDateRange(start, end)

  const handleSelect = (next: DateRange | undefined) => {
    setRange(next)
    onChange(next?.from ? next.from.toISOString() : null, next?.to ? next.to.toISOString() : null)
  }

  return (
    <Popover>
      <PopoverTrigger className={fieldTriggerVariants()}>
        <span className="flex-1 truncate">
          {label ?? <span className="text-muted-foreground/72">Add timeline</span>}
        </span>
        <Icon name={Icons.ui.unfold} className={fieldTriggerChevronClassName} aria-hidden="true" />
      </PopoverTrigger>

      <PopoverPopup align="start">
        <Calendar mode="range" numberOfMonths={2} selected={range} onSelect={handleSelect} />
      </PopoverPopup>
    </Popover>
  )
}

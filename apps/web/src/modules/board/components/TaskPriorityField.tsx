import { Icons } from '@/lib/Icons'
import { cn } from '@/lib/utils'
import type { Priority } from '@/shared/types'
import { Icon } from '@/shared/ui/Icon'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { PRIORITY_META, PRIORITY_ORDER } from '../constants'

interface Props {
  value: Priority
  onChange: (priority: Priority) => void
}

function PriorityFlag({ priority }: { priority: Priority }) {
  return (
    <Icon
      name={Icons.ui.flag}
      size={14}
      color="currentColor"
      className={cn('shrink-0', PRIORITY_META[priority].iconClass)}
      aria-hidden="true"
    />
  )
}

export function TaskPriorityField({ value, onChange }: Props) {
  const labels = Object.fromEntries(
    PRIORITY_ORDER.map((p) => [p, PRIORITY_META[p].label]),
  ) as Record<Priority, string>

  return (
    <Select items={labels} value={value} onValueChange={(v) => onChange(v as Priority)}>
      <SelectTrigger variant="ghost">
        <SelectValue>
          {(p: Priority) => (
            <span className="flex items-center gap-2">
              <PriorityFlag priority={p} />
              {PRIORITY_META[p].label}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>

      <SelectContent>
        {PRIORITY_ORDER.map((p) => (
          <SelectItem key={p} value={p}>
            <span className="flex items-center gap-2">
              <PriorityFlag priority={p} />
              {PRIORITY_META[p].label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

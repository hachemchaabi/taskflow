import type { List } from '@/shared/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { StatusIcon } from './StatusIcon'

interface Props {
  lists: List[]
  value: string | undefined
  onChange: (listId: string) => void
}

export function TaskStatusField({ lists, value, onChange }: Props) {
  const titleById = Object.fromEntries(lists.map((l) => [l.id, l.title]))

  return (
    <Select items={titleById} value={value ?? ''} onValueChange={(v) => onChange(v as string)}>
      <SelectTrigger variant="ghost">
        <SelectValue
          placeholder="Select status"
          className="data-placeholder:text-muted-foreground/72"
        >
          {(id: string) => {
            const title = titleById[id]
            if (!title) return 'Select status'
            return (
              <span className="flex items-center gap-2">
                <StatusIcon title={title} size={16} />
                {title}
              </span>
            )
          }}
        </SelectValue>
      </SelectTrigger>

      <SelectContent>
        {lists.map((l) => (
          <SelectItem key={l.id} value={l.id}>
            <span className="flex items-center gap-2">
              <StatusIcon title={l.title} size={16} />
              {l.title}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

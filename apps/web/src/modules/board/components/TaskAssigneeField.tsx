import { useRef } from 'react'
import { Icons } from '@/lib/Icons'
import type { BoardMember } from '@/shared/types'
import { AvatarGroup } from '@/shared/components/AvatarGroup'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import {
  Combobox,
  ComboboxTrigger,
  ComboboxInput,
  ComboboxPopup,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/shared/ui/combobox'
import { fieldTriggerVariants, fieldTriggerChevronClassName } from '@/shared/ui/select'
import { Icon } from '@/shared/ui/Icon'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { PanelEmptyState } from './PanelEmptyState'
import { initials } from '../utils'

interface Props {
  members: BoardMember[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function TaskAssigneeField({ members, selectedIds, onChange }: Props) {
  const { user } = useAuth()
  const selected = members.filter((m) => selectedIds.includes(m.userId))
  const anchorRef = useRef<HTMLButtonElement>(null)

  return (
    <Combobox<BoardMember, true>
      multiple
      items={members}
      value={selected}
      onValueChange={(next) => onChange(next.map((m) => m.userId))}
      itemToStringLabel={(m) => m.user.name}
      isItemEqualToValue={(a, b) => a.userId === b.userId}
    >
      <ComboboxTrigger
        render={
          <button type="button" ref={anchorRef} className={fieldTriggerVariants()}>
            <span className="flex min-w-0 flex-1 items-center">
              {selected.length > 0 ? (
                <AvatarGroup
                  members={selected.map((m) => ({
                    id: m.userId,
                    name: m.user.name,
                    avatarUrl: m.user.avatarUrl,
                  }))}
                />
              ) : (
                <span className="text-muted-foreground/72">Add assignees</span>
              )}
            </span>
            <Icon
              name={Icons.ui.unfold}
              className={fieldTriggerChevronClassName}
              aria-hidden="true"
            />
          </button>
        }
      />

      <ComboboxPopup anchor={anchorRef} className="w-64">
        <div className="border-b border-border p-1.5">
          <ComboboxInput placeholder="Search members…" showTrigger={false} size="sm" />
        </div>

        <ComboboxEmpty className="not-empty:p-0">
          <PanelEmptyState
            icon={Icons.user.user}
            title="No members found"
            hint="Try a different search."
          />
        </ComboboxEmpty>

        <ComboboxList>
          {(m: BoardMember) => (
            <ComboboxItem key={m.userId} value={m}>
              <span className="flex items-center gap-2">
                <Avatar className="size-6 rounded-md text-xs">
                  {m.user.avatarUrl ? (
                    <AvatarImage src={m.user.avatarUrl} alt={m.user.name} />
                  ) : null}

                  <AvatarFallback className="rounded-md">{initials(m.user.name)}</AvatarFallback>
                </Avatar>

                {m.userId === user?.id ? 'Me' : m.user.name}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  )
}

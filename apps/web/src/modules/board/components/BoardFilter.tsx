import { Icons } from '@/lib/Icons'
import { cn } from '@/lib/utils'
import type { BoardDetail } from '@/shared/types'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Icon } from '@/shared/ui/Icon'
import { Input } from '@/shared/ui/input'
import { Popover, PopoverPopup, PopoverTrigger } from '@/shared/ui/popover'
import { Separator } from '@/shared/ui/separator'
import { AvatarGroup } from '@/shared/components/AvatarGroup'
import { FILTER, PRIORITY_META, PRIORITY_ORDER } from '../constants'
import type { BoardFilters } from '../hooks/useBoardFilters'
import { LabelBadge } from './LabelBadge'

function CheckRow({
  checked,
  onToggle,
  children,
}: {
  checked: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-accent/50">
      <Checkbox checked={checked} onCheckedChange={onToggle} />
      <span className="flex min-w-0 flex-1 items-center gap-2">{children}</span>
    </label>
  )
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="px-1.5 text-xs font-medium text-muted-foreground">{heading}</p>
      {children}
    </div>
  )
}

export function BoardFilter({ board, filters }: { board: BoardDetail; filters: BoardFilters }) {
  const {
    query,
    setQuery,
    priorities,
    labelIds,
    assigneeIds,
    togglePriority,
    toggleLabel,
    toggleAssignee,
    activeCount,
    clear,
  } = filters

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline">
            <Icon name={Icons.actions.filter} size={16} aria-hidden="true" />
            {FILTER.trigger}
            {activeCount > 0 && (
              <Badge size="sm" aria-label={`${activeCount} active filters`}>
                {activeCount}
              </Badge>
            )}
          </Button>
        }
      />
      <PopoverPopup align="end" className="w-72">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{FILTER.title}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              disabled={activeCount === 0}
              className="h-auto px-2 py-1 text-xs text-muted-foreground"
            >
              {FILTER.clear}
            </Button>
          </div>

          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={FILTER.searchPlaceholder}
            aria-label={FILTER.searchLabel}
          />

          <Separator className="-mx-4 data-[orientation=horizontal]:w-[calc(100%+--spacing(8))]" />

          <Section heading={FILTER.priorityHeading}>
            {PRIORITY_ORDER.map((p) => (
              <CheckRow key={p} checked={priorities.has(p)} onToggle={() => togglePriority(p)}>
                <Icon
                  name={Icons.ui.flag}
                  size={14}
                  color="currentColor"
                  className={cn('shrink-0', PRIORITY_META[p].iconClass)}
                  aria-hidden="true"
                />
                {PRIORITY_META[p].label}
              </CheckRow>
            ))}
          </Section>

          <Separator className="-mx-4 data-[orientation=horizontal]:w-[calc(100%+--spacing(8))]" />

          <Section heading={FILTER.labelsHeading}>
            {board.labels.length === 0 ? (
              <p className="px-1.5 text-xs text-muted-foreground">{FILTER.noLabels}</p>
            ) : (
              board.labels.map((label) => (
                <CheckRow
                  key={label.id}
                  checked={labelIds.has(label.id)}
                  onToggle={() => toggleLabel(label.id)}
                >
                  <LabelBadge name={label.name} color={label.color} />
                </CheckRow>
              ))
            )}
          </Section>

          <Separator className="-mx-4 data-[orientation=horizontal]:w-[calc(100%+--spacing(8))]" />

          <Section heading={FILTER.assigneesHeading}>
            {board.members.length === 0 ? (
              <p className="px-1.5 text-xs text-muted-foreground">{FILTER.noMembers}</p>
            ) : (
              board.members.map((member) => (
                <CheckRow
                  key={member.userId}
                  checked={assigneeIds.has(member.userId)}
                  onToggle={() => toggleAssignee(member.userId)}
                >
                  <AvatarGroup
                    members={[member.user]}
                    size={20}
                    fontClassName="text-[10px]"
                    radiusClassName="rounded-md"
                  />
                  <span className="truncate">{member.user.name}</span>
                </CheckRow>
              ))
            )}
          </Section>
        </div>
      </PopoverPopup>
    </Popover>
  )
}

import { useState } from 'react'
import type { Label } from '@/shared/types'
import { notifyError } from '@/shared/utils/notify'
import { Icons } from '@/lib/Icons'
import {
  Combobox,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxPopup,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/shared/ui/combobox'
import { labelApi } from '../data/labelApi'
import { nextLabelColor } from '../data/labelColors'
import { LabelBadge } from './LabelBadge'
import { PanelEmptyState } from './PanelEmptyState'

interface Props {
  boardId: string
  available: Label[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  onLabelCreated: (label: Label) => void
}

export function TaskLabelField({
  boardId,
  available,
  selectedIds,
  onChange,
  onLabelCreated,
}: Props) {
  const [query, setQuery] = useState('')
  const selected = available.filter((l) => selectedIds.includes(l.id))
  const trimmed = query.trim()
  const exists = available.some((l) => l.name.toLowerCase() === trimmed.toLowerCase())
  const canCreate = !!trimmed && !exists
  const nextColor = nextLabelColor(available)

  const createLabel = async () => {
    if (!canCreate) return
    try {
      const label = await labelApi.create(boardId, { name: trimmed, color: nextColor })
      onLabelCreated(label)
      onChange([...selectedIds, label.id])
      setQuery('')
    } catch {
      notifyError('Could not create the label.')
    }
  }

  return (
    <Combobox<Label, true>
      multiple
      items={available}
      value={selected}
      inputValue={query}
      onValueChange={(next) => onChange(next.map((l) => l.id))}
      itemToStringLabel={(l) => l.name}
      isItemEqualToValue={(a, b) => a.id === b.id}
    >
      <ComboboxChips variant="ghost">
        {selected.map((l) => (
          <ComboboxChip
            key={l.id}
            className="group relative flex max-w-[140px] items-center overflow-hidden rounded-full px-2.5 py-0.5 text-xs font-medium leading-5 outline-none"
            style={{
              backgroundColor: `color-mix(in srgb, ${l.color} 16%, transparent)`,
              color: `color-mix(in srgb, ${l.color}, black 28%)`,
            }}
            removeProps={{
              className:
                "absolute inset-y-0 end-0 hidden cursor-pointer items-center justify-center rounded-e-full ps-2 pe-1.5 outline-none group-hover:flex [&_svg:not([class*='size-'])]:size-3.5",
              style: {
                backgroundColor: `color-mix(in srgb, ${l.color} 16%, var(--color-card))`,
                color: `color-mix(in srgb, ${l.color}, black 28%)`,
              },
            }}
          >
            <span className="truncate">{l.name}</span>
          </ComboboxChip>
        ))}
        <ComboboxChipsInput
          className="ps-0 placeholder:text-muted-foreground/72"
          placeholder={selected.length ? '' : 'Add labels'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canCreate) {
              e.preventDefault()
              void createLabel()
            }
          }}
        />
      </ComboboxChips>
      <ComboboxPopup>
        <ComboboxEmpty className="not-empty:p-1">
          {canCreate ? (
            <button
              type="button"
              onClick={() => void createLabel()}
              className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg px-2 text-start text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
            >
              <span className="shrink-0 text-muted-foreground">Create</span>
              <LabelBadge name={trimmed} color={nextColor} className="min-w-0 truncate" />
              <kbd className="ms-auto inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-muted px-1.5 py-0.5 font-sans text-xs text-muted-foreground">
                ↵
              </kbd>
            </button>
          ) : available.length === 0 ? (
            <PanelEmptyState
              icon={Icons.ui.tag}
              title="No labels yet"
              hint="Type a name, then press Enter to create one."
            />
          ) : (
            <p className="px-2 py-1.5 text-start">No matching labels.</p>
          )}
        </ComboboxEmpty>
        <ComboboxList>
          {(l: Label) => (
            <ComboboxItem key={l.id} value={l}>
              <LabelBadge name={l.name} color={l.color} />
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  )
}

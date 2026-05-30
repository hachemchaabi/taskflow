import type { CardActivity } from '@/shared/types'
import { Icons } from '@/lib/Icons'
import { PanelEmptyState } from './PanelEmptyState'

export function TaskActivity({ activities }: { activities: CardActivity[] }) {
  if (activities.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <PanelEmptyState
          icon={Icons.ui.clock}
          title="No activity yet"
          hint="Edits, status changes and assignments to this task will appear here."
        />
      </div>
    )
  }
  return (
    <ul className="flex flex-col gap-3">
      {activities.map((a) => (
        <li key={a.id} className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{a.user.name}</span> {a.action}
          <span className="ms-2 text-xs">{new Date(a.createdAt).toLocaleString()}</span>
        </li>
      ))}
    </ul>
  )
}

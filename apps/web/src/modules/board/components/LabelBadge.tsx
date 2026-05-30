import type { Label } from '@/shared/types'
import { cn } from '@/lib/utils'

export function LabelBadge({
  name,
  color,
  className,
}: {
  name: string
  color: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium leading-5',
        className,
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
        color: `color-mix(in srgb, ${color}, black 28%)`,
      }}
    >
      {name}
    </span>
  )
}

export function LabelBadgeList({ labels, max = 3 }: { labels: Label[]; max?: number }) {
  if (labels.length === 0) return null
  const shown = labels.slice(0, max)
  const overflow = labels.length - shown.length

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {shown.map((l) => (
        <LabelBadge key={l.id} name={l.name} color={l.color} />
      ))}
      {overflow > 0 && (
        <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-xs font-medium leading-5 text-muted-foreground">
          +{overflow}
        </span>
      )}
    </span>
  )
}

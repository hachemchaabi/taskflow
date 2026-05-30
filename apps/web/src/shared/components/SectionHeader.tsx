import { Icon, type IconName } from '@/shared/ui/Icon'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  icon: IconName
  title: string
  description: string
  tone?: 'accent' | 'danger'
}

const TONE_CLASSES = {
  accent: 'bg-primary/10 text-primary',
  danger: 'bg-destructive/10 text-destructive',
} as const

export function SectionHeader({ icon, title, description, tone = 'accent' }: SectionHeaderProps) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          TONE_CLASSES[tone],
        )}
      >
        <Icon name={icon} size={20} />
      </span>
      <div className="space-y-0.5">
        <h2 className="font-heading font-semibold text-slate-text">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

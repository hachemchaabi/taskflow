import { cn } from '@/lib/utils'
import { type StatusKey, matchStatus } from '../utils'

const COLOR: Record<StatusKey, string> = {
  todo: 'text-muted-foreground',
  'in-progress': 'text-warning',
  done: 'text-success',
}

const LABEL: Record<StatusKey, string> = {
  todo: 'To do',
  'in-progress': 'In progress',
  done: 'Done',
}

function Glyph({ status }: { status: StatusKey }) {
  switch (status) {
    case 'todo':
      return (
        <circle
          cx="12"
          cy="12"
          r="8.25"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeDasharray="2.4 3"
        />
      )
    case 'in-progress':
      return (
        <>
          <circle cx="12" cy="12" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.75" />
          <path d="M12 3.75a8.25 8.25 0 0 1 0 16.5z" fill="currentColor" />
        </>
      )
    case 'done':
      return (
        <>
          <circle cx="12" cy="12" r="9" fill="currentColor" />
          <path
            d="m8 12.25 2.6 2.6L16 9.4"
            fill="none"
            stroke="var(--color-cloud-white)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )
  }
}

interface Props {
  title: string
  size?: number
  className?: string
}

export function StatusIcon({ title, size = 16, className }: Props) {
  const status = matchStatus(title)
  if (!status) return null

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={LABEL[status]}
      className={cn('shrink-0', COLOR[status], className)}
    >
      <Glyph status={status} />
    </svg>
  )
}

import { Spinner } from '@/shared/ui/spinner'

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 p-8 text-slate-500" role="status">
      <Spinner variant="accent" className="size-5" />
      <span>{label}</span>
    </div>
  )
}

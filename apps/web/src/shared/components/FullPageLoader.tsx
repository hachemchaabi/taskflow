import { Spinner } from '../ui/spinner'

export function FullPageLoader() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Spinner variant="accent" className="size-6" />
    </div>
  )
}

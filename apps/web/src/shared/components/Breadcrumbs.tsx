import { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui/breadcrumb'
import { Skeleton } from '@/shared/ui/skeleton'
import { useBreadcrumbLabels } from '../hooks/useBreadcrumbLabel'

const LABELS: Record<string, string> = {
  boards: 'Boards',
  settings: 'Settings',
}

const COLLECTION_SEGMENTS = new Set(['boards'])

const NON_NAVIGABLE_SEGMENTS = new Set(['boards', 'settings'])

type ResolvedSegment = { pending: true } | { pending: false; label: string }

function labelFor(
  segment: string,
  index: number,
  segments: string[],
  dynamic: Record<string, string | null>,
): ResolvedSegment {
  if (segment in dynamic) {
    const label = dynamic[segment]
    return label === null ? { pending: true } : { pending: false, label }
  }
  if (index > 0 && COLLECTION_SEGMENTS.has(segments[index - 1])) {
    return { pending: true }
  }
  return {
    pending: false,
    label: LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1),
  }
}

function PendingLabel() {
  return <Skeleton className="h-4 w-24" role="status" aria-label="Loading…" />
}

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const dynamicLabels = useBreadcrumbLabels()
  const segments = pathname.split('/').filter(Boolean)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {segments.length === 0 ? (
            <BreadcrumbPage>Home</BreadcrumbPage>
          ) : (
            <BreadcrumbLink render={<Link to="/" />}>Home</BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {segments.map((segment, index) => {
          const to = `/${segments.slice(0, index + 1).join('/')}`
          const isLast = index === segments.length - 1
          const navigable = !NON_NAVIGABLE_SEGMENTS.has(segment)
          const resolved = labelFor(segment, index, segments, dynamicLabels)
          return (
            <Fragment key={to}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {resolved.pending ? (
                  <BreadcrumbPage>
                    <PendingLabel />
                  </BreadcrumbPage>
                ) : isLast || !navigable ? (
                  <BreadcrumbPage>{resolved.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link to={to} />}>{resolved.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

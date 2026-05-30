import type { IconName } from '@/lib/Icons'
import { Icon } from '@/shared/ui/Icon'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/shared/ui/empty'

interface Props {
  icon: IconName
  title: string
  hint: string
}

export function PanelEmptyState({ icon, title, hint }: Props) {
  return (
    <Empty className="px-4 py-8 md:py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon name={icon} aria-hidden="true" />
        </EmptyMedia>

        <EmptyTitle className="text-base">{title}</EmptyTitle>

        <EmptyDescription className="max-w-60">{hint}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

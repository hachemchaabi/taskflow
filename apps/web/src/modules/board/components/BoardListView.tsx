import { Icons } from '@/lib/Icons'
import type { BoardDetail } from '@/shared/types'
import { AvatarGroup } from '@/shared/components/AvatarGroup'
import { Badge } from '@/shared/ui/badge'
import { Icon } from '@/shared/ui/Icon'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/shared/ui/empty'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { formatDateRange } from '../utils'
import { useTaskSheet } from '../data/TaskSheetContext'
import { LabelBadgeList } from './LabelBadge'
import { StatusIcon } from './StatusIcon'

const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position

export function BoardListView({ board }: { board: BoardDetail }) {
  const lists = [...board.lists].sort(byPosition)
  const { openCard } = useTaskSheet()

  return (
    <div className="flex flex-col gap-6 py-4">
      {lists.map((list) => (
        <section key={list.id}>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <StatusIcon title={list.title} size={16} />
            {list.title}
            <Badge variant="outline" size="sm">
              {list.cards.length}
            </Badge>
          </h2>

          {list.cards.length === 0 ? (
            <Empty className="rounded-lg border border-border bg-card px-4 py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Icon name={Icons.navigation.board} aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle className="text-base">No cards yet</EmptyTitle>
                <EmptyDescription>Cards added to this list will show up here.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...list.cards].sort(byPosition).map((card) => {
                  const dateRange = formatDateRange(card.startDate, card.endDate)
                  return (
                    <TableRow key={card.id}>
                      <TableCell className="font-medium text-foreground">
                        <button
                          type="button"
                          onClick={() => openCard(card.id)}
                          className="text-start hover:underline focus-visible:underline focus-visible:outline-none"
                        >
                          {card.title}
                        </button>
                      </TableCell>
                      <TableCell>
                        {card.labels.length > 0 ? (
                          <LabelBadgeList labels={card.labels} />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {card.assignees.length > 0 ? (
                          <AvatarGroup members={card.assignees} size={24} />
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {dateRange ? (
                          <span className="inline-flex items-center gap-1 text-sm">
                            <Icon name={Icons.ui.calendar} size={14} aria-hidden="true" />
                            {dateRange}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </section>
      ))}
    </div>
  )
}

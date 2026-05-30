import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '@/components/kibo-ui/kanban'
import { Icons } from '@/lib/Icons'
import { cn } from '@/lib/utils'
import type { BoardDetail, Card } from '@/shared/types'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/Icon'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { type KanbanItem, useBoardKanban } from '../hooks/useBoardKanban'
import { matchStatus } from '../utils'
import { useTaskSheet } from '../data/TaskSheetContext'
import { BoardCard } from './BoardCard'
import { StatusIcon } from './StatusIcon'

const COLUMN_ACCENTS = ['bg-info', 'bg-success', 'bg-warning', 'bg-primary', 'bg-chart-3'] as const

export function BoardKanban({
  board,
  onChanged,
  highlightedCardId = null,
  matches,
}: {
  board: BoardDetail
  onChanged: () => void
  highlightedCardId?: string | null
  matches?: (card: Card) => boolean
}) {
  const { columns, items, setItems, countFor, onDragStart, onDragEnd } = useBoardKanban(
    board,
    matches,
  )
  const { openCreate, openCard } = useTaskSheet()

  return (
    <ScrollArea scrollFade className="min-h-0 flex-1 pb-2">
      <KanbanProvider
        columns={columns}
        data={items}
        onDataChange={setItems}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className="size-full auto-cols-[minmax(306px,1fr)] gap-3"
      >
        {(column) => {
          const accent =
            COLUMN_ACCENTS[columns.findIndex((c) => c.id === column.id) % COLUMN_ACCENTS.length]

          return (
            <KanbanBoard
              key={column.id}
              id={column.id}
              className="rounded-lg border-border bg-secondary/50 shadow-none"
            >
              <KanbanHeader className="flex items-center gap-2 px-3 py-2.5">
                {matchStatus(column.name) ? (
                  <StatusIcon title={column.name} size={20} />
                ) : (
                  <span className={cn('size-2 rounded-sm', accent)} aria-hidden="true" />
                )}
                <span className="text-sm font-semibold text-foreground">{column.name}</span>
                <Badge variant="outline" size="sm">
                  {countFor(column.id)}
                </Badge>

                <div className="ms-auto flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Add card to ${column.name}`}
                    onClick={() => openCreate(column.id)}
                  >
                    <Icon name={Icons.actions.add} size={16} aria-hidden="true" />
                  </Button>
                </div>
              </KanbanHeader>

              <KanbanCards<KanbanItem> id={column.id} className="gap-2 p-2">
                {(item) => (
                  <KanbanCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    column={item.column}
                    className={cn(
                      'rounded-lg border border-border bg-card p-3 shadow-[var(--shadow-subtle)] transition-shadow hover:shadow-[var(--shadow-md)]',
                      item.id === highlightedCardId && 'animate-card-pulse',
                    )}
                  >
                    <BoardCard
                      card={item.card}
                      onOpen={() => openCard(item.card.id)}
                      onChanged={onChanged}
                    />
                  </KanbanCard>
                )}
              </KanbanCards>
            </KanbanBoard>
          )
        }}
      </KanbanProvider>
    </ScrollArea>
  )
}

import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Icons } from '@/lib/Icons'
import type { Label } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Icon } from '@/shared/ui/Icon'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/shared/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip'
import { boardsApi } from '../data/boardApi'
import { TaskSheetProvider, useTaskSheet } from '../data/TaskSheetContext'
import { Loading } from '../../../shared/components/Loading'
import { useFetch } from '../../../shared/hooks/useFetch'
import { useSetBreadcrumbLabel } from '../../../shared/hooks/useBreadcrumbLabel'
import { useBoardFilters } from '../hooks/useBoardFilters'
import { BoardFilter } from '../components/BoardFilter'
import { BoardKanban } from '../components/BoardKanban'
import { BoardListView } from '../components/BoardListView'
import { BoardPresence } from '../components/BoardPresence'
import { TaskSheet } from '../components/TaskSheet'
import { useBoardRealtime } from '../hooks/useBoardRealtime'

function AddTaskButton() {
  const { openCreate } = useTaskSheet()
  return (
    <Button onClick={() => openCreate()}>
      <Icon name={Icons.actions.add} size={16} aria-hidden="true" />
      Add Task
    </Button>
  )
}

export default function BoardPage() {
  const { id = '' } = useParams()
  const {
    data: board,
    loading,
    error,
    refetch,
  } = useFetch((signal) => boardsApi.get(id, signal), [id], { cacheKey: `board:${id}` })
  const [extraLabels, setExtraLabels] = useState<Label[]>([])
  const [searchParams] = useSearchParams()
  const { presence, highlightedCardId } = useBoardRealtime(id, refetch)
  const filters = useBoardFilters()

  useSetBreadcrumbLabel(id, board?.title)

  if (loading && !board) return <Loading label="Loading board…" />

  if (error && !board) {
    return <p className="text-destructive">Couldn’t load board: {error}</p>
  }

  if (!board) return null

  return (
    <TaskSheetProvider initialCardId={searchParams.get('card') ?? undefined}>
      <section className="flex min-h-0 flex-1 flex-col gap-4">
        <header>
          <h1 className="text-2xl font-semibold text-foreground">{board.title}</h1>
        </header>

        <Tabs defaultValue="board" className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList>
              <TabsTab value="board">
                <Icon name={Icons.navigation.board} size={16} aria-hidden="true" />
                Board View
              </TabsTab>

              <TooltipProvider delay={300}>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span className="flex">
                        <TabsTab value="list" disabled>
                          <Icon name={Icons.file.clipboard} size={16} aria-hidden="true" />
                          List View
                        </TabsTab>
                      </span>
                    }
                  />
                  <TooltipContent side="top" sideOffset={6}>
                    Coming soon
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TabsList>

            <div className="flex items-center gap-2">
              <BoardPresence users={presence} />

              <BoardFilter board={board} filters={filters} />

              <AddTaskButton />
            </div>
          </div>

          <TabsPanel value="board" className="flex min-h-0 flex-1 flex-col">
            <BoardKanban
              board={board}
              onChanged={refetch}
              highlightedCardId={highlightedCardId}
              matches={filters.matches}
            />
          </TabsPanel>

          <TabsPanel value="list" className="min-h-0 flex-1 overflow-y-auto">
            <BoardListView board={board} />
          </TabsPanel>
        </Tabs>
      </section>

      <TaskSheet
        board={board}
        onChanged={refetch}
        extraLabels={extraLabels}
        onLabelCreated={(l) => setExtraLabels((p) => [...p, l])}
      />
    </TaskSheetProvider>
  )
}

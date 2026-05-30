import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/shared/ui/empty'
import { Icon } from '@/shared/ui/Icon'
import { Icons } from '@/lib/Icons'
import { Loading } from '@/shared/components/Loading'
import { PRIORITY_META, CARD_META } from '@/modules/board/constants'
import { formatShortDate } from '../utils'
import type { MyTask } from '../hooks/useMyTasks'

interface MyTasksTableProps {
  tasks: MyTask[]
  loading: boolean
}

export function MyTasksTable({ tasks, loading }: MyTasksTableProps) {
  const navigate = useNavigate()

  if (loading && tasks.length === 0) return <Loading label="Loading your tasks…" />

  if (tasks.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon name={Icons.navigation.board} aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>No tasks assigned to you</EmptyTitle>
          <EmptyDescription>
            Tasks assigned to you across this workspace&rsquo;s boards will show up here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const open = (task: MyTask) => navigate(`/boards/${task.boardId}?card=${task.id}`)

  return (
    <Table>
      <TableHeader>
        <TableRow className="not-in-data-[variant=card]:hover:bg-transparent">
          <TableHead className="w-40">Priority</TableHead>
          <TableHead>Task</TableHead>
          <TableHead className="w-48">Board</TableHead>
          <TableHead className="w-32">Due</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          const priority = PRIORITY_META[task.priority]
          return (
            <TableRow
              key={task.id}
              className="cursor-pointer"
              role="link"
              tabIndex={0}
              aria-label={`Open task ${task.title}`}
              onClick={() => open(task)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  open(task)
                }
              }}
            >
              <TableCell>
                <span className="flex items-center gap-2">
                  <Icon
                    name={Icons.ui.flag}
                    size={14}
                    color="currentColor"
                    className={cn('shrink-0', priority.iconClass)}
                    aria-hidden="true"
                  />
                  <span className="text-sm">{priority.label}</span>
                </span>
              </TableCell>
              <TableCell className="text-foreground">{task.title}</TableCell>
              <TableCell className="text-foreground">{task.boardTitle}</TableCell>
              <TableCell className={task.endDate ? 'text-foreground' : 'text-muted-foreground'}>
                {task.endDate ? formatShortDate(task.endDate) : CARD_META.noDueDate}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

import { useEffect, useState, type ReactNode } from 'react'
import type { BoardDetail, CardDetail, Label } from '@/shared/types'
import type { UpdateCardInput } from '../data/cardApi'
import { Icons, type IconName } from '@/lib/Icons'
import { Icon } from '@/shared/ui/Icon'
import {
  Sheet,
  SheetPopup,
  SheetHeader,
  SheetPanel,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/shared/ui/sheet'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { Tabs, TabsList, TabsTab, TabsPanel } from '@/shared/ui/tabs'
import { Field, FieldLabel } from '@/shared/ui/field'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { useTaskSheet } from '../data/TaskSheetContext'
import { useTaskDraft } from '../hooks/useTaskDraft'
import { useCardRealtime } from '../hooks/useCardRealtime'
import { TaskStatusField } from './TaskStatusField'
import { TaskPriorityField } from './TaskPriorityField'
import { TaskTimelineField } from './TaskTimelineField'
import { TaskAssigneeField } from './TaskAssigneeField'
import { TaskLabelField } from './TaskLabelField'
import { TaskComments } from './TaskComments'
import { TaskActivity } from './TaskActivity'
import { DeleteCardDialog } from './DeleteCardDialog'

interface Props {
  board: BoardDetail
  onChanged: () => void
  extraLabels: Label[]
  onLabelCreated: (label: Label) => void
}

export function TaskSheet({ board, onChanged, extraLabels, onLabelCreated }: Props) {
  const { state, close } = useTaskSheet()
  const open = state.mode !== 'closed'
  const boardLabelIds = new Set(board.labels.map((l) => l.id))
  const labels = [...board.labels, ...extraLabels.filter((l) => !boardLabelIds.has(l.id))]

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) close()
      }}
    >
      <SheetPopup side="right" className="w-full sm:max-w-md">
        {state.mode === 'create' && (
          <CreateBody
            board={board}
            labels={labels}
            listId={state.listId}
            onCreated={close}
            onChanged={onChanged}
            onLabelCreated={onLabelCreated}
          />
        )}
        {state.mode === 'view' && (
          <ViewBody
            key={state.cardId}
            board={board}
            labels={labels}
            cardId={state.cardId}
            onChanged={onChanged}
            onLabelCreated={onLabelCreated}
          />
        )}
      </SheetPopup>
    </Sheet>
  )
}

function CreateBody({
  board,
  labels,
  listId,
  onCreated,
  onChanged,
  onLabelCreated,
}: {
  board: BoardDetail
  labels: Label[]
  listId?: string
  onCreated: (id: string) => void
  onChanged: () => void
  onLabelCreated: (l: Label) => void
}) {
  const { draft, setField, saving, submit } = useTaskDraft({
    mode: 'create',
    boardId: board.id,
    listId,
    onCreated,
    onChanged,
  })

  return (
    <>
      <SheetHeader>
        <SheetTitle>New task</SheetTitle>
        <SheetDescription>
          Add a task to this board and set its status, timeline, assignees and labels.
        </SheetDescription>
      </SheetHeader>

      <SheetPanel className="flex flex-col gap-4">
        <Field>
          <FieldLabel>Task name</FieldLabel>

          <Input
            value={draft.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="Task title"
          />
        </Field>

        <FieldRow label="Status" icon={Icons.ui.status}>
          <TaskStatusField
            lists={board.lists}
            value={draft.listId}
            onChange={(id) => setField('listId', id)}
          />
        </FieldRow>

        <FieldRow label="Priority" icon={Icons.ui.flag}>
          <TaskPriorityField value={draft.priority} onChange={(p) => setField('priority', p)} />
        </FieldRow>

        <FieldRow label="Timeline" icon={Icons.ui.calendar}>
          <TaskTimelineField
            start={draft.startDate}
            end={draft.endDate}
            onChange={(s, e) => {
              setField('startDate', s)
              setField('endDate', e)
            }}
          />
        </FieldRow>

        <FieldRow label="Assignee" icon={Icons.user.user}>
          <TaskAssigneeField
            members={board.members}
            selectedIds={draft.assigneeIds}
            onChange={(ids) => setField('assigneeIds', ids)}
          />
        </FieldRow>

        <FieldRow label="Label" icon={Icons.ui.tag}>
          <TaskLabelField
            boardId={board.id}
            available={labels}
            selectedIds={draft.labelIds}
            onChange={(ids) => setField('labelIds', ids)}
            onLabelCreated={onLabelCreated}
          />
        </FieldRow>

        <Field>
          <FieldLabel>Description</FieldLabel>

          <Textarea
            value={draft.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="Add a description…"
            rows={4}
          />
        </Field>
      </SheetPanel>

      <SheetFooter>
        <Button
          onClick={() => void submit()}
          loading={saving}
          disabled={!draft.title.trim() || !draft.listId}
        >
          Create task
        </Button>
      </SheetFooter>
    </>
  )
}

function ViewBody({
  board,
  labels,
  cardId,
  onChanged,
  onLabelCreated,
}: {
  board: BoardDetail
  labels: Label[]
  cardId: string
  onChanged: () => void
  onLabelCreated: (l: Label) => void
}) {
  const { detail, loading, saving, commit, addComment, editComment, deleteComment, reload } =
    useTaskDraft({
      mode: 'view',
      boardId: board.id,
      cardId,
      onCreated: () => {},
      onChanged,
    })

  if (loading || !detail) return null

  return (
    <TaskEditForm
      key={detail.id}
      board={board}
      labels={labels}
      detail={detail}
      saving={saving}
      onChanged={onChanged}
      onLabelCreated={onLabelCreated}
      onAddComment={addComment}
      onEditComment={editComment}
      onDeleteComment={deleteComment}
      onExternalReload={reload}
      onSave={(patch) => {
        if (Object.keys(patch).length > 0) void commit(patch)
      }}
    />
  )
}

const sameSet = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((x) => set.has(x))
}

function TaskEditForm({
  board,
  labels,
  detail,
  saving,
  onChanged,
  onSave,
  onLabelCreated,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onExternalReload,
}: {
  board: BoardDetail
  labels: Label[]
  detail: CardDetail
  saving: boolean
  onChanged: () => void
  onSave: (patch: UpdateCardInput) => void
  onLabelCreated: (l: Label) => void
  onAddComment: (body: string) => Promise<void>
  onEditComment: (commentId: string, body: string) => Promise<void>
  onDeleteComment: (commentId: string) => Promise<void>
  onExternalReload: () => Promise<void>
}) {
  const { close } = useTaskSheet()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [title, setTitle] = useState(detail.title)
  const [description, setDescription] = useState(detail.description ?? '')
  const [listId, setListId] = useState(detail.listId)
  const [priority, setPriority] = useState(detail.priority)
  const [startDate, setStartDate] = useState<string | null>(detail.startDate ?? null)
  const [endDate, setEndDate] = useState<string | null>(detail.endDate ?? null)
  const [assigneeIds, setAssigneeIds] = useState(detail.assignees.map((a) => a.id))
  const [labelIds, setLabelIds] = useState(detail.labels.map((l) => l.id))

  const patch: UpdateCardInput = {}
  if (title.trim() && title.trim() !== detail.title) patch.title = title.trim()
  if (description !== (detail.description ?? '')) patch.description = description
  if (listId !== detail.listId) patch.listId = listId
  if (priority !== detail.priority) patch.priority = priority
  if (startDate !== (detail.startDate ?? null)) patch.startDate = startDate
  if (endDate !== (detail.endDate ?? null)) patch.endDate = endDate
  if (
    !sameSet(
      assigneeIds,
      detail.assignees.map((a) => a.id),
    )
  )
    patch.assigneeIds = assigneeIds
  if (
    !sameSet(
      labelIds,
      detail.labels.map((l) => l.id),
    )
  )
    patch.labelIds = labelIds
  const dirty = Object.keys(patch).length > 0

  const { typingUsers, onTyping, setEditing } = useCardRealtime({
    boardId: board.id,
    cardId: detail.id,
    cardTitle: detail.title,
    onExternalChange: onExternalReload,
  })
  useEffect(() => {
    setEditing(dirty)
  }, [dirty, setEditing])

  return (
    <>
      <SheetHeader>
        <SheetTitle>Task details</SheetTitle>
        <SheetDescription>
          View and edit this task’s details, assignees, labels and comments.
        </SheetDescription>
      </SheetHeader>

      <SheetPanel className="flex h-full min-h-0 flex-col gap-4">
        <div className="flex shrink-0 flex-col gap-4">
          <Field>
            <FieldLabel>Task name</FieldLabel>

            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
          </Field>

          <FieldRow label="Status" icon={Icons.ui.status}>
            <TaskStatusField lists={board.lists} value={listId} onChange={setListId} />
          </FieldRow>

          <FieldRow label="Priority" icon={Icons.ui.flag}>
            <TaskPriorityField value={priority} onChange={setPriority} />
          </FieldRow>

          <FieldRow label="Timeline" icon={Icons.ui.calendar}>
            <TaskTimelineField
              start={startDate}
              end={endDate}
              onChange={(s, e) => {
                setStartDate(s)
                setEndDate(e)
              }}
            />
          </FieldRow>

          <FieldRow label="Assignee" icon={Icons.user.user}>
            <TaskAssigneeField
              members={board.members}
              selectedIds={assigneeIds}
              onChange={setAssigneeIds}
            />
          </FieldRow>

          <FieldRow label="Label" icon={Icons.ui.tag}>
            <TaskLabelField
              boardId={board.id}
              available={labels}
              selectedIds={labelIds}
              onChange={setLabelIds}
              onLabelCreated={onLabelCreated}
            />
          </FieldRow>

          <Field>
            <FieldLabel>Description</FieldLabel>

            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description…"
              rows={4}
            />
          </Field>
        </div>

        <Tabs defaultValue="comments" className="mt-2 flex min-h-0 flex-1 flex-col">
          <TabsList className="w-full shrink-0">
            <TabsTab value="comments">Comments</TabsTab>
            <TabsTab value="activity">Activity</TabsTab>
          </TabsList>

          <TabsPanel value="comments" className="min-h-0 flex-1 pt-4">
            <TaskComments
              comments={detail.comments}
              members={board.members}
              onPublish={onAddComment}
              onEdit={onEditComment}
              onDelete={onDeleteComment}
              typingUsers={typingUsers}
              onTyping={onTyping}
            />
          </TabsPanel>

          <TabsPanel value="activity" className="min-h-0 flex-1 pt-4">
            <ScrollArea scrollFade scrollbarGutter className="h-full">
              <TaskActivity activities={detail.activities} />
            </ScrollArea>
          </TabsPanel>
        </Tabs>
      </SheetPanel>

      <SheetFooter>
        <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
          <Icon name={Icons.actions.delete} size={16} aria-hidden="true" />
          Delete task
        </Button>
        <Button onClick={() => onSave(patch)} loading={saving} disabled={!dirty || !title.trim()}>
          Save changes
        </Button>
      </SheetFooter>

      <DeleteCardDialog
        cardId={detail.id}
        cardTitle={detail.title}
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        onDeleted={() => {
          close()
          onChanged()
        }}
      />
    </>
  )
}

function FieldRow({
  label,
  icon,
  children,
}: {
  label: string
  icon: IconName
  children: ReactNode
}) {
  return (
    <div className="grid grid-cols-[104px_1fr] items-center gap-3">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon name={icon} size={16} className="shrink-0 opacity-80" aria-hidden="true" />
        {label}
      </span>

      <div className="min-w-0">{children}</div>
    </div>
  )
}

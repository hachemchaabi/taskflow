import { describe, it, expect, vi, beforeEach } from 'vitest'
import { type ComponentProps } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { BoardMember, Comment } from '@/shared/types'
import { TaskComments } from './TaskComments'
import { SUBMIT_SHORTCUT } from '../constants'

const currentUser = { id: 'uviewer' }
vi.mock('../../auth/hooks/useAuth', () => ({ useAuth: () => ({ user: currentUser }) }))

const workspaceRole = { value: 'MEMBER' as 'OWNER' | 'ADMIN' | 'MEMBER' }
vi.mock('../../workspace/hooks/useWorkspace', () => ({
  useWorkspace: () => ({ activeWorkspace: { role: workspaceRole.value } }),
}))

beforeEach(() => {
  currentUser.id = 'uviewer'
  workspaceRole.value = 'MEMBER'
})

const members: BoardMember[] = [
  {
    id: 'bm1',
    userId: 'ualice',
    role: 'MEMBER',
    user: { id: 'ualice', name: 'Alice Martin', email: 'alice@x.io', avatarUrl: null },
  },
  {
    id: 'bm2',
    userId: 'ubob',
    role: 'MEMBER',
    user: { id: 'ubob', name: 'Bob Chen', email: 'bob@x.io', avatarUrl: null },
  },
]

const comment = (over: Partial<Comment> = {}): Comment => ({
  id: 'c1',
  body: 'hello',
  createdAt: '2026-05-30T00:00:00.000Z',
  editedAt: null,
  deletedAt: null,
  author: { id: 'ubob', name: 'Bob Chen', avatarUrl: null },
  mentions: [],
  ...over,
})

const renderComments = (props: Partial<ComponentProps<typeof TaskComments>> = {}) =>
  render(
    <TaskComments
      comments={[]}
      members={members}
      onPublish={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      typingUsers={[]}
      onTyping={vi.fn()}
      {...props}
    />,
  )

describe('TaskComments', () => {
  it('renders an existing comment, resolving a mention token to a chip', () => {
    renderComments({
      comments: [comment({ body: 'Hey @[ualice]', mentions: [{ user: members[0].user }] })],
    })
    expect(screen.getByText('@Alice Martin')).toBeInTheDocument()
  })

  it('labels the viewer as "Me" in suggestions and their own mention chip', () => {
    currentUser.id = 'ualice'
    renderComments({
      comments: [comment({ body: 'note to @[ualice]', mentions: [{ user: members[0].user }] })],
    })
    expect(screen.getByText('@Me')).toBeInTheDocument()
    expect(screen.queryByText('@Alice Martin')).not.toBeInTheDocument()

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '@al', selectionStart: 3 } })
    expect(screen.getByRole('option', { name: /Me/ })).toBeInTheDocument()
  })

  it('publishes a typed @mention as a tokenized body', async () => {
    const onPublish = vi.fn().mockResolvedValue(undefined)
    renderComments({ onPublish })

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '@al', selectionStart: 3 } })
    fireEvent.mouseDown(screen.getByRole('option', { name: /Alice Martin/ }))
    fireEvent.click(screen.getByRole('button', { name: /publish/i }))

    await waitFor(() => expect(onPublish).toHaveBeenCalledWith('@[ualice]', undefined))
  })

  it('publishes plain text with no mentions', async () => {
    const onPublish = vi.fn().mockResolvedValue(undefined)
    renderComments({ onPublish })

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'looks good', selectionStart: 10 },
    })
    fireEvent.click(screen.getByRole('button', { name: /publish/i }))
    await waitFor(() => expect(onPublish).toHaveBeenCalledWith('looks good', undefined))
  })

  it('shows comment actions to the author', () => {
    currentUser.id = 'ubob'
    renderComments({ comments: [comment()] })
    expect(screen.getByLabelText('Comment actions')).toBeInTheDocument()
  })

  it('hides comment actions from a non-author MEMBER but shows them to a moderator', () => {
    currentUser.id = 'uviewer'
    workspaceRole.value = 'MEMBER'
    const { unmount } = renderComments({ comments: [comment()] })
    expect(screen.queryByLabelText('Comment actions')).not.toBeInTheDocument()
    unmount()

    workspaceRole.value = 'ADMIN'
    renderComments({ comments: [comment()] })
    expect(screen.getByLabelText('Comment actions')).toBeInTheDocument()
  })

  it('publishes on ⌘/Ctrl+Enter and shows the shortcut hint on the button', async () => {
    const onPublish = vi.fn().mockResolvedValue(undefined)
    renderComments({ onPublish })

    expect(screen.getByRole('button', { name: /publish/i })).toHaveTextContent(SUBMIT_SHORTCUT)

    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'ship it', selectionStart: 7 } })
    fireEvent.keyDown(input, { key: 'Enter', metaKey: true })

    await waitFor(() => expect(onPublish).toHaveBeenCalledWith('ship it', undefined))
  })

  it('does not publish on a bare Enter (newline) without the modifier', () => {
    const onPublish = vi.fn().mockResolvedValue(undefined)
    renderComments({ onPublish })

    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'still typing', selectionStart: 12 } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onPublish).not.toHaveBeenCalled()
  })

  it('shows a typing indicator when someone else is typing', () => {
    renderComments({ typingUsers: [{ id: 'ux', name: 'Dana' }] })
    expect(screen.getByText(/Dana is typing/)).toBeInTheDocument()
  })

  it('nests replies under their parent; every comment offers Reply', () => {
    const root = comment({ id: 'root', body: 'root question' })
    const reply = comment({ id: 'rep', body: 'a reply', parentId: 'root' })
    renderComments({ comments: [root, reply] })

    expect(screen.getByText('root question')).toBeInTheDocument()
    expect(screen.getByText('a reply')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Reply' })).toHaveLength(2)
  })

  it('replying to a reply posts under the same thread and mentions the reply author', async () => {
    const onPublish = vi.fn().mockResolvedValue(undefined)
    const root = comment({ id: 'root', body: 'root question' })
    const reply = comment({
      id: 'rep',
      body: 'a reply',
      parentId: 'root',
      author: { id: 'ualice', name: 'Alice Martin', avatarUrl: null },
    })
    renderComments({ comments: [root, reply], onPublish })

    fireEvent.click(screen.getAllByRole('button', { name: 'Reply' })[1])
    expect(screen.getByText(/Replying to/)).toHaveTextContent('Alice Martin')

    fireEvent.click(screen.getByRole('button', { name: /send reply/i }))
    await waitFor(() => expect(onPublish).toHaveBeenCalledWith('@[ualice]', 'rep'))
  })

  it('replies: seeds @author, shows the chip, and posts with the parentId', async () => {
    const onPublish = vi.fn().mockResolvedValue(undefined)
    renderComments({ comments: [comment({ id: 'root', body: 'root question' })], onPublish })

    fireEvent.click(screen.getByRole('button', { name: 'Reply' }))
    expect(screen.getByText(/Replying to/)).toHaveTextContent('Bob Chen')

    fireEvent.click(screen.getByRole('button', { name: /send reply/i }))
    await waitFor(() => expect(onPublish).toHaveBeenCalledWith('@[ubob]', 'root'))
  })

  it('cancels a reply, restoring the top-level composer', () => {
    renderComments({ comments: [comment({ id: 'root' })] })

    fireEvent.click(screen.getByRole('button', { name: 'Reply' }))
    expect(screen.getByText(/Replying to/)).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Cancel reply'))
    expect(screen.queryByText(/Replying to/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument()
  })
})

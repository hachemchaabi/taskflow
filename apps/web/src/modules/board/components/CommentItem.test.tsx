import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { BoardMember, Comment } from '@/shared/types'
import { CommentItem } from './CommentItem'

const members: BoardMember[] = [
  {
    id: 'bm1',
    userId: 'ubob',
    role: 'MEMBER',
    user: { id: 'ubob', name: 'Bob Chen', email: 'bob@x.io', avatarUrl: null },
  },
]

const comment = (over: Partial<Comment> = {}): Comment => ({
  id: 'cm1',
  body: 'hello there',
  createdAt: '2026-05-30T00:00:00.000Z',
  editedAt: null,
  deletedAt: null,
  author: { id: 'ubob', name: 'Bob Chen', avatarUrl: null },
  mentions: [],
  ...over,
})

const noop = vi.fn().mockResolvedValue(undefined)

describe('CommentItem', () => {
  it('shows the body and, for the author, an actions menu with Edit + Delete', () => {
    render(
      <CommentItem
        comment={comment()}
        members={members}
        currentUserId="ubob"
        canModerate={false}
        onEdit={noop}
        onDelete={noop}
      />,
    )
    expect(screen.getByText('hello there')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Comment actions'))
    expect(screen.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument()
  })

  it('shows no actions for a non-author who cannot moderate', () => {
    render(
      <CommentItem
        comment={comment()}
        members={members}
        currentUserId="usomeone"
        canModerate={false}
        onEdit={noop}
        onDelete={noop}
      />,
    )
    expect(screen.queryByLabelText('Comment actions')).not.toBeInTheDocument()
  })

  it('lets a moderator delete but not edit someone else’s comment', () => {
    render(
      <CommentItem
        comment={comment()}
        members={members}
        currentUserId="uadmin"
        canModerate
        onEdit={noop}
        onDelete={noop}
      />,
    )
    fireEvent.click(screen.getByLabelText('Comment actions'))
    expect(screen.queryByRole('menuitem', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument()
  })

  it('renders an "(edited)" label when the comment was edited', () => {
    render(
      <CommentItem
        comment={comment({ editedAt: '2026-05-30T01:00:00.000Z' })}
        members={members}
        currentUserId="ubob"
        canModerate={false}
        onEdit={noop}
        onDelete={noop}
      />,
    )
    expect(screen.getByText(/\(edited\)/)).toBeInTheDocument()
  })

  it('shows a placeholder (keeping the author) for a deleted comment, with no actions', () => {
    render(
      <CommentItem
        comment={comment({ deletedAt: '2026-05-30T02:00:00.000Z', body: '' })}
        members={members}
        currentUserId="ubob"
        canModerate
        onEdit={noop}
        onDelete={noop}
      />,
    )
    expect(screen.getByText('(comment deleted)')).toBeInTheDocument()
    expect(screen.getByText('Bob Chen')).toBeInTheDocument()
    expect(screen.queryByLabelText('Comment actions')).not.toBeInTheDocument()
  })

  it('shows a Reply button when onReply is provided, and calls it on click', () => {
    const onReply = vi.fn()
    render(
      <CommentItem
        comment={comment()}
        members={members}
        currentUserId="usomeone"
        canModerate={false}
        onEdit={noop}
        onDelete={noop}
        onReply={onReply}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Reply' }))
    expect(onReply).toHaveBeenCalled()
  })

  it('hides Reply on a deleted comment', () => {
    render(
      <CommentItem
        comment={comment({ deletedAt: '2026-05-30T02:00:00.000Z', body: '' })}
        members={members}
        currentUserId="ubob"
        canModerate={false}
        onEdit={noop}
        onDelete={noop}
        onReply={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Reply' })).not.toBeInTheDocument()
  })

  it('saves an edit on ⌘/Ctrl+Enter', async () => {
    const onEdit = vi.fn().mockResolvedValue(undefined)
    render(
      <CommentItem
        comment={comment()}
        members={members}
        currentUserId="ubob"
        canModerate={false}
        onEdit={onEdit}
        onDelete={noop}
      />,
    )
    fireEvent.click(screen.getByLabelText('Comment actions'))
    fireEvent.click(screen.getByRole('menuitem', { name: /edit/i }))

    const editor = screen.getByRole('combobox')
    fireEvent.keyDown(editor, { key: 'Enter', ctrlKey: true })
    await waitFor(() => expect(onEdit).toHaveBeenCalledWith('cm1', 'hello there'))
  })

  it('confirms before deleting, then calls onDelete', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined)
    render(
      <CommentItem
        comment={comment()}
        members={members}
        currentUserId="ubob"
        canModerate={false}
        onEdit={noop}
        onDelete={onDelete}
      />,
    )
    fireEvent.click(screen.getByLabelText('Comment actions'))
    fireEvent.click(screen.getByRole('menuitem', { name: /delete/i }))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('cm1'))
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { WorkspaceInvite, WorkspaceMember } from '@/shared/types'

const updateMemberRole = vi.fn().mockResolvedValue({})
const removeMember = vi.fn().mockResolvedValue(undefined)
const updateInviteRole = vi.fn().mockResolvedValue({})
const revokeInvite = vi.fn().mockResolvedValue(undefined)
vi.mock('../data/workspaceApi', () => ({
  workspacesApi: {
    updateMemberRole: (...args: unknown[]) => updateMemberRole(...args),
    removeMember: (...args: unknown[]) => removeMember(...args),
    updateInviteRole: (...args: unknown[]) => updateInviteRole(...args),
    revokeInvite: (...args: unknown[]) => revokeInvite(...args),
  },
}))

vi.mock('@/shared/utils/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}))

import { MembersTable } from './MembersTable'

const members: WorkspaceMember[] = [
  {
    id: 'm1',
    userId: 'u1',
    role: 'OWNER',
    createdAt: '2026-05-20T00:00:00.000Z',
    user: { id: 'u1', name: 'Owner One', email: 'owner@example.com', avatarUrl: null },
  },
  {
    id: 'm2',
    userId: 'u2',
    role: 'ADMIN',
    createdAt: '2026-05-21T00:00:00.000Z',
    user: { id: 'u2', name: 'Member Two', email: 'two@example.com', avatarUrl: null },
  },
  {
    id: 'm3',
    userId: 'u3',
    role: 'MEMBER',
    createdAt: '2026-05-22T00:00:00.000Z',
    user: { id: 'u3', name: 'Member Three', email: 'three@example.com', avatarUrl: null },
  },
]

const invites: WorkspaceInvite[] = [
  {
    id: 'i1',
    email: 'invitee@example.com',
    role: 'MEMBER',
    status: 'PENDING',
    createdAt: '2026-05-29T00:00:00.000Z',
    workspace: { id: 'ws1', name: 'Acme' },
    invitedBy: { id: 'u1', name: 'Owner One' },
  },
]

const renderTable = (props: Partial<Parameters<typeof MembersTable>[0]> = {}) =>
  render(
    <MembersTable
      workspaceId="ws1"
      members={members}
      canManage
      currentUserId="u1"
      onChanged={vi.fn()}
      {...props}
    />,
  )

describe('MembersTable', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists every member with name and email', () => {
    renderTable()
    expect(screen.getByText('Owner One')).toBeInTheDocument()
    expect(screen.getByText('two@example.com')).toBeInTheDocument()
    expect(screen.getByText('Member Three')).toBeInTheDocument()
  })

  it('shows a Joined column with each member’s formatted join date', () => {
    renderTable()
    expect(screen.getByRole('columnheader', { name: /joined/i })).toBeInTheDocument()
    expect(screen.getByText(/May 20, 2026/)).toBeInTheDocument()
    expect(screen.getByText(/May 22, 2026/)).toBeInTheDocument()
  })

  it('locks the owner row: an Owner badge, no role select, no remove', () => {
    renderTable()
    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.queryByLabelText('Role for Owner One')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /remove owner one/i })).not.toBeInTheDocument()
  })

  it('gives the owner editable role selects and remove actions for other members', () => {
    renderTable()
    expect(screen.getByLabelText('Role for Member Two')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /remove member two/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Role for Member Three')).toBeInTheDocument()
  })

  it('changes a member role through the select', async () => {
    renderTable()
    await userEvent.click(screen.getByLabelText('Role for Member Three'))
    await userEvent.click(await screen.findByRole('option', { name: 'Admin' }))
    await waitFor(() => expect(updateMemberRole).toHaveBeenCalledWith('ws1', 'u3', 'ADMIN'))
  })

  it('removes a member after confirming in the dialog', async () => {
    renderTable()
    await userEvent.click(screen.getByRole('button', { name: /remove member two/i }))
    const dialog = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /remove member/i }))
    await waitFor(() => expect(removeMember).toHaveBeenCalledWith('ws1', 'u2'))
  })

  it('is read-only for non-owners: no selects, no remove actions, roles as text', () => {
    renderTable({ canManage: false, currentUserId: 'u3' })
    expect(screen.queryByLabelText('Role for Member Two')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: /actions/i })).not.toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  it('renders pending invites with email and a Pending status', () => {
    renderTable({ invites, canManageInvites: true })
    expect(screen.getByText('invitee@example.com')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('changes a pending invite role through the select', async () => {
    renderTable({ invites, canManageInvites: true, onInvitesChanged: vi.fn() })
    await userEvent.click(screen.getByLabelText('Role for invitee@example.com'))
    await userEvent.click(await screen.findByRole('option', { name: 'Admin' }))
    await waitFor(() => expect(updateInviteRole).toHaveBeenCalledWith('ws1', 'i1', 'ADMIN'))
  })

  it('revokes a pending invite after confirming in the dialog', async () => {
    renderTable({ invites, canManageInvites: true, onInvitesChanged: vi.fn() })
    await userEvent.click(screen.getByRole('button', { name: /revoke invitation for invitee/i }))
    const dialog = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: /revoke invite/i }))
    await waitFor(() => expect(revokeInvite).toHaveBeenCalledWith('ws1', 'i1'))
  })

  it('shows invites read-only when the viewer cannot manage them', () => {
    renderTable({ invites, canManage: false, canManageInvites: false, currentUserId: 'u3' })
    expect(screen.getByText('invitee@example.com')).toBeInTheDocument()
    expect(screen.queryByLabelText('Role for invitee@example.com')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /revoke invitation for invitee/i }),
    ).not.toBeInTheDocument()
  })
})

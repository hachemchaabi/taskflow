import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SidebarProvider } from '@/shared/ui/sidebar'
import { BoardSidebarItem } from './BoardSidebarItem'

vi.mock('../hooks/useBoardSharing', () => ({
  useBoardSharing: () => ({
    loading: false,
    members: [],
    candidates: [],
    add: vi.fn(),
    remove: vi.fn(),
    changeRole: vi.fn(),
    busyUserId: null,
    canManage: true,
    isOwner: true,
  }),
}))

import type { MemberRole } from '@/shared/types'

const makeBoard = (role: MemberRole) => ({
  id: 'b1',
  title: 'Website Sprint',
  owner: { id: 'u1', name: 'A', email: 'a@x.io' },
  role,
  _count: { members: 1, lists: 3 },
})

function setup(role: MemberRole = 'OWNER') {
  return render(
    <MemoryRouter>
      <SidebarProvider>
        <BoardSidebarItem board={makeBoard(role)} isActive={false} onChanged={vi.fn()} />
      </SidebarProvider>
    </MemoryRouter>,
  )
}

describe('BoardSidebarItem', () => {
  it('renders the board link', () => {
    setup()
    expect(screen.getByRole('link', { name: /website sprint/i })).toBeInTheDocument()
  })

  it('opens the actions menu with Share, Edit, Delete for the owner', async () => {
    setup('OWNER')
    await userEvent.click(screen.getByRole('button', { name: /list actions/i }))
    expect(await screen.findByRole('menuitem', { name: /share/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument()
  })

  it('opens the edit dialog from the menu', async () => {
    setup('OWNER')
    await userEvent.click(screen.getByRole('button', { name: /list actions/i }))
    await userEvent.click(await screen.findByRole('menuitem', { name: /edit/i }))
    expect(await screen.findByRole('heading', { name: /edit list/i })).toBeInTheDocument()
  })

  it('hides the actions menu entirely for a member', () => {
    setup('MEMBER')
    expect(screen.queryByRole('button', { name: /list actions/i })).not.toBeInTheDocument()
  })

  it('shows the menu without Delete for an admin', async () => {
    setup('ADMIN')
    await userEvent.click(screen.getByRole('button', { name: /list actions/i }))
    expect(await screen.findByRole('menuitem', { name: /share/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /delete/i })).not.toBeInTheDocument()
  })
})

import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})

const switchWorkspace = vi.fn()
vi.mock('../hooks/useWorkspace', () => ({
  useWorkspace: () => ({
    workspaces: [
      {
        id: 'a',
        name: 'Acme',
        description: null,
        role: 'OWNER',
        _count: { members: 1, boards: 0 },
      },
      {
        id: 'b',
        name: 'Beta',
        description: null,
        role: 'MEMBER',
        _count: { members: 2, boards: 1 },
      },
    ],
    activeWorkspace: { id: 'a', name: 'Acme', role: 'OWNER' },
    switchWorkspace,
  }),
}))

import { SidebarProvider } from '@/shared/ui/sidebar'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'

function setup() {
  return render(
    <MemoryRouter>
      <SidebarProvider>
        <WorkspaceSwitcher />
      </SidebarProvider>
    </MemoryRouter>,
  )
}

describe('WorkspaceSwitcher', () => {
  it('shows the active workspace name', () => {
    setup()
    expect(screen.getByText('Acme')).toBeInTheDocument()
  })

  it('switches workspace when another is picked', async () => {
    setup()
    await userEvent.click(screen.getByRole('button'))
    await userEvent.click(await screen.findByRole('menuitem', { name: /beta/i }))
    expect(switchWorkspace).toHaveBeenCalledWith('b')
  })
})

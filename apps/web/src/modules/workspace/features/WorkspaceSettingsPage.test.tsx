import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const updateWorkspace = vi.fn().mockResolvedValue({})
const uploadLogo = vi.fn().mockResolvedValue({})
const removeLogo = vi.fn().mockResolvedValue({})
const transferOwnership = vi.fn().mockResolvedValue({})
const deleteWorkspace = vi.fn().mockResolvedValue(undefined)
const refetch = vi.fn()
const workspace = {
  id: 'a',
  name: 'Acme',
  slug: 'acme',
  description: null,
  logoUrl: null,
  locale: 'en',
  visibility: 'PRIVATE',
  defaultMemberRole: 'MEMBER',
  role: 'OWNER',
  _count: { members: 1, boards: 0 },
}
vi.mock('../hooks/useWorkspace', () => ({
  useWorkspace: () => ({
    activeWorkspace: workspace,
    updateWorkspace,
    uploadLogo,
    removeLogo,
    transferOwnership,
    deleteWorkspace,
  }),
}))

vi.mock('@/shared/hooks/useFetch', () => ({
  useFetch: () => ({
    data: {
      id: 'a',
      members: [
        {
          id: 'm1',
          userId: 'u1',
          role: 'OWNER',
          user: { id: 'u1', name: 'Owner One', email: 'owner@example.com', avatarUrl: null },
        },
        {
          id: 'm2',
          userId: 'u2',
          role: 'ADMIN',
          user: { id: 'u2', name: 'Member Two', email: 'two@example.com', avatarUrl: null },
        },
      ],
    },
    loading: false,
    error: null,
    refetch,
  }),
}))

import WorkspaceSettingsPage from './WorkspaceSettingsPage'

const renderPage = () =>
  render(
    <MemoryRouter>
      <WorkspaceSettingsPage />
    </MemoryRouter>,
  )

describe('WorkspaceSettingsPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the workspace settings and a danger zone for owners', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /workspace settings/i })).toBeInTheDocument()
    expect(screen.getByText(/danger zone/i)).toBeInTheDocument()
  })

  it('saves name and description edits through the general section', async () => {
    renderPage()
    const nameInput = screen.getByLabelText('Name', { selector: '#ws-name' })
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Acme Inc')
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }))
    expect(updateWorkspace).toHaveBeenCalledWith('a', { name: 'Acme Inc', description: null })
  })

  it('uploads a valid logo file', async () => {
    renderPage()
    const input = screen.getByLabelText('Logo')
    const file = new File(['x'], 'logo.png', { type: 'image/png' })
    await userEvent.upload(input, file)
    await waitFor(() => expect(uploadLogo).toHaveBeenCalledWith('a', file))
  })

  it('rejects a non-image logo file without uploading', async () => {
    renderPage()
    const input = screen.getByLabelText('Logo')
    const file = new File(['x'], 'note.txt', { type: 'text/plain' })
    await userEvent.upload(input, file, { applyAccept: false })
    expect(uploadLogo).not.toHaveBeenCalled()
  })

  it('shows the workspace owner', async () => {
    renderPage()
    expect(await screen.findByText('Owner One')).toBeInTheDocument()
  })

  it('transfers ownership to a selected member', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /^transfer ownership$/i }))
    await userEvent.click(screen.getByRole('radio', { name: /Member Two/ }))
    await userEvent.click(screen.getByRole('button', { name: /confirm transfer/i }))
    await waitFor(() => expect(transferOwnership).toHaveBeenCalledWith('a', 'u2'))
  })

  it('requires typing the exact name before deleting', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /delete workspace/i }))
    const dialog = await screen.findByRole('alertdialog')
    const confirm = within(dialog).getByRole('button', { name: /delete workspace/i })
    expect(confirm).toBeDisabled()

    await userEvent.type(within(dialog).getByLabelText(/to confirm/i), 'Acme')
    expect(confirm).toBeEnabled()
    await userEvent.click(confirm)
    await waitFor(() => expect(deleteWorkspace).toHaveBeenCalledWith('a'))
  })
})

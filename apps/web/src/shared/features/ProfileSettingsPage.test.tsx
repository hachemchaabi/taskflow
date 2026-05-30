import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { User } from '@/shared/types'
import ProfileSettingsPage from './ProfileSettingsPage'

const auth = {
  user: { id: 'u1', name: 'Ada Lovelace', email: 'ada@x.io', avatarUrl: null } as User,
  logout: vi.fn().mockResolvedValue(undefined),
  updateProfile: vi.fn().mockResolvedValue(undefined),
  uploadAvatar: vi.fn().mockResolvedValue(undefined),
  removeAvatar: vi.fn().mockResolvedValue(undefined),
}
vi.mock('@/modules/auth/hooks/useAuth', () => ({ useAuth: () => auth }))
vi.mock('@/modules/theme/hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}))
vi.mock('@/shared/utils/notify', () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
  notifyInfo: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  auth.user = { id: 'u1', name: 'Ada Lovelace', email: 'ada@x.io', avatarUrl: null }
})

describe('ProfileSettingsPage', () => {
  it('shows the name as editable and the email as disabled', () => {
    render(<ProfileSettingsPage />)
    expect(screen.getByLabelText('Name')).not.toBeDisabled()
    const email = screen.getByLabelText('Email')
    expect(email).toBeDisabled()
    expect(email).toHaveValue('ada@x.io')
    expect(screen.getByText(/email address can’t be changed/i)).toBeInTheDocument()
  })

  it('keeps Save disabled until the name changes, then persists the trimmed name', async () => {
    render(<ProfileSettingsPage />)
    const save = screen.getByRole('button', { name: /save changes/i })
    expect(save).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '  Grace Hopper  ' } })
    expect(save).not.toBeDisabled()

    fireEvent.click(save)
    await waitFor(() => expect(auth.updateProfile).toHaveBeenCalledWith('Grace Hopper'))
  })

  it('validates that the name is not empty', () => {
    render(<ProfileSettingsPage />)
    const name = screen.getByLabelText('Name')
    fireEvent.change(name, { target: { value: '   ' } })
    fireEvent.blur(name)
    expect(screen.getByText(/please enter your name/i)).toBeInTheDocument()
  })

  it('offers to upload a photo when none is set', () => {
    render(<ProfileSettingsPage />)
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
  })

  it('shows Replace and Remove when an avatar exists', () => {
    auth.user = { ...auth.user, avatarUrl: 'https://img/a.png' }
    render(<ProfileSettingsPage />)
    expect(screen.getByRole('button', { name: /replace/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument()
  })

  it('signs out when Log out is clicked', async () => {
    render(<ProfileSettingsPage />)
    fireEvent.click(screen.getByRole('button', { name: /log out/i }))
    await waitFor(() => expect(auth.logout).toHaveBeenCalled())
  })
})

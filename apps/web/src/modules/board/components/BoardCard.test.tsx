import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BoardCard } from './BoardCard'
import type { Card } from '@/shared/types'

const card: Card = {
  id: 'c1',
  title: 'UX Copywriter',
  position: 0,
  priority: 'HIGH',
  startDate: '2026-06-01T00:00:00.000Z',
  endDate: '2026-06-05T00:00:00.000Z',
  assignees: [{ id: 'u1', name: 'Sadek Hosen', avatarUrl: null }],
  labels: [{ id: 'l1', name: 'Writing', color: '#3ba6f1' }],
  description: 'Polish the onboarding copy across the product.',
  _count: { comments: 2 },
}

describe('BoardCard', () => {
  it('renders the title, label and date range and calls onOpen on click', () => {
    const onOpen = vi.fn()
    render(<BoardCard card={card} onOpen={onOpen} onChanged={vi.fn()} />)
    expect(screen.getByText('UX Copywriter')).toBeInTheDocument()
    expect(screen.getByText('Writing')).toBeInTheDocument()
    expect(screen.getByLabelText('High priority')).toBeInTheDocument()
    expect(screen.getByText(/→/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('UX Copywriter'))
    expect(onOpen).toHaveBeenCalled()
  })

  it('shows muted placeholders for a name-only task', () => {
    const bare: Card = {
      id: 'c2',
      title: 'task 1',
      position: 0,
      priority: 'NONE',
      startDate: null,
      endDate: null,
      assignees: [],
      labels: [],
      _count: { comments: 0 },
    }
    render(<BoardCard card={bare} onOpen={vi.fn()} onChanged={vi.fn()} />)
    expect(screen.getByText('No labels')).toBeInTheDocument()
    expect(screen.getByText('No due date')).toBeInTheDocument()
    expect(screen.getByText('Unassigned')).toBeInTheDocument()
    expect(screen.getByLabelText('No priority')).toBeInTheDocument()
  })

  it('opens the delete confirmation without triggering onOpen', async () => {
    const onOpen = vi.fn()
    render(<BoardCard card={card} onOpen={onOpen} onChanged={vi.fn()} />)
    fireEvent.click(screen.getByLabelText('Delete task'))
    expect(onOpen).not.toHaveBeenCalled()
    expect(await screen.findByText(/will be permanently deleted/)).toBeInTheDocument()
  })
})

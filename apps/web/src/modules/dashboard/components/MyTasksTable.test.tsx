import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { MyTasksTable } from './MyTasksTable'
import type { MyTask } from '../hooks/useMyTasks'

const navigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigate }
})

function makeTask(over: Partial<MyTask> & { id: string }): MyTask {
  return {
    title: over.id,
    position: 0,
    priority: 'HIGH',
    description: null,
    startDate: null,
    endDate: null,
    assignees: [],
    labels: [],
    boardId: 'b1',
    boardTitle: 'Roadmap',
    listId: 'l1',
    ...over,
  } as MyTask
}

beforeEach(() => navigate.mockClear())

describe('MyTasksTable', () => {
  it('navigates to the board with the card param on row click', () => {
    render(
      <MemoryRouter>
        <MyTasksTable tasks={[makeTask({ id: 'c1', title: 'Ship dashboard' })]} loading={false} />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('Ship dashboard'))
    expect(navigate).toHaveBeenCalledWith('/boards/b1?card=c1')
  })

  it('opens the task on Enter for keyboard users', () => {
    render(
      <MemoryRouter>
        <MyTasksTable tasks={[makeTask({ id: 'c2', title: 'Wire API' })]} loading={false} />
      </MemoryRouter>,
    )
    fireEvent.keyDown(screen.getByRole('link', { name: 'Open task Wire API' }), { key: 'Enter' })
    expect(navigate).toHaveBeenCalledWith('/boards/b1?card=c2')
  })

  it('shows an empty state when there are no tasks', () => {
    render(
      <MemoryRouter>
        <MyTasksTable tasks={[]} loading={false} />
      </MemoryRouter>,
    )
    expect(screen.getByText('No tasks assigned to you')).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TaskLabelField } from './TaskLabelField'
import { labelApi } from '../data/labelApi'

vi.mock('../data/labelApi', () => ({ labelApi: { create: vi.fn() } }))

describe('TaskLabelField', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a new label when Enter is pressed on an unknown name', async () => {
    vi.mocked(labelApi.create).mockResolvedValue({
      id: 'new',
      name: 'Bug',
      color: '#3ba6f1',
    })
    const onChange = vi.fn()
    const onLabelCreated = vi.fn()
    render(
      <TaskLabelField
        boardId="b1"
        available={[]}
        selectedIds={[]}
        onChange={onChange}
        onLabelCreated={onLabelCreated}
      />,
    )
    const input =
      screen.queryByPlaceholderText('Add labels') ??
      screen.getByRole('combobox') ??
      screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Bug' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() =>
      expect(labelApi.create).toHaveBeenCalledWith('b1', {
        name: 'Bug',
        color: expect.any(String),
      }),
    )
    expect(onLabelCreated).toHaveBeenCalled()
  })
})

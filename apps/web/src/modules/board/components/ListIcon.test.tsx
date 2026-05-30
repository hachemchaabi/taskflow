import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ListIcon } from './ListIcon'

describe('ListIcon', () => {
  it('shows the uppercased first letter of the title as the fallback', () => {
    render(<ListIcon board={{ id: 'b1', title: 'website sprint', iconUrl: null }} />)
    expect(screen.getByText('W')).toBeInTheDocument()
  })

  it('falls back to "L" when the title is blank', () => {
    render(<ListIcon board={{ id: 'b2', title: '   ', iconUrl: null }} />)
    expect(screen.getByText('L')).toBeInTheDocument()
  })

  it('applies a deterministic token-backed color to the fallback', () => {
    render(<ListIcon board={{ id: 'b3', title: 'Design', iconUrl: null }} />)
    expect(screen.getByText('D').className).toMatch(/bg-[\w-]+/)
  })
})

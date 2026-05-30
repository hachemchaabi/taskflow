import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Breadcrumbs } from './Breadcrumbs'
import { BreadcrumbLabelProvider } from './BreadcrumbLabelContext'
import { useSetBreadcrumbLabel } from '../hooks/useBreadcrumbLabel'

function LabelRegistrar({ id, title }: { id: string; title?: string }) {
  useSetBreadcrumbLabel(id, title)
  return null
}

function renderBreadcrumbs(id: string, title?: string) {
  return render(
    <MemoryRouter initialEntries={[`/boards/${id}`]}>
      <BreadcrumbLabelProvider>
        <Breadcrumbs />
        <LabelRegistrar id={id} title={title} />
      </BreadcrumbLabelProvider>
    </MemoryRouter>,
  )
}

describe('Breadcrumbs', () => {
  it('shows a loading placeholder instead of the raw id while the label loads', () => {
    renderBreadcrumbs('clz9k3board')

    expect(screen.getByRole('status', { name: 'Loading…' })).toBeInTheDocument()
    expect(screen.queryByText(/clz9k3board/i)).not.toBeInTheDocument()
  })

  it('shows the resolved title once the label is registered', () => {
    const { rerender } = renderBreadcrumbs('clz9k3board')

    rerender(
      <MemoryRouter initialEntries={['/boards/clz9k3board']}>
        <BreadcrumbLabelProvider>
          <Breadcrumbs />
          <LabelRegistrar id="clz9k3board" title="Sprint Board" />
        </BreadcrumbLabelProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('Sprint Board')).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Loading…' })).not.toBeInTheDocument()
  })

  it('shows a placeholder for a collection child even before any page registers it', () => {
    render(
      <MemoryRouter initialEntries={['/boards/clz9k3board']}>
        <BreadcrumbLabelProvider>
          <Breadcrumbs />
        </BreadcrumbLabelProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('status', { name: 'Loading…' })).toBeInTheDocument()
    expect(screen.queryByText(/clz9k3board/i)).not.toBeInTheDocument()
  })

  it('renders a non-navigable parent segment as plain text, not a link', () => {
    renderBreadcrumbs('clz9k3board', 'Sprint Board')

    expect(screen.queryByRole('link', { name: 'Boards' })).not.toBeInTheDocument()
    expect(screen.getByText('Boards')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
  })
})

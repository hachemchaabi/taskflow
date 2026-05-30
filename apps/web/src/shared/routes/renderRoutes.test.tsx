import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Link } from 'react-router-dom'
import { lazy } from 'react'
import { renderRoutes, type RouteConfig } from './index'

function controllablePage(label: string) {
  let resolve!: () => void
  const ready = new Promise<void>((r) => (resolve = r))
  const component = lazy(async () => {
    await ready
    return { default: () => <div>{label}</div> }
  })
  return {
    component,
    resolve: () =>
      act(() => {
        resolve()
        return ready
      }),
  }
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav>
        <Link to="/a">go a</Link>
        <Link to="/b">go b</Link>
      </nav>
      <div data-testid="sidebar">sidebar</div>
      {children}
    </div>
  )
}

const isHidden = (testId: string) => {
  let el: HTMLElement | null = screen.queryByTestId(testId)
  while (el) {
    if (el.hidden || el.style.display === 'none') return true
    el = el.parentElement
  }
  return false
}

describe('renderRoutes', () => {
  it('keeps the layout (sidebar) mounted and visible while a lazy page chunk loads', async () => {
    const a = controllablePage('Page A')
    const b = controllablePage('Page B')
    const routes: RouteConfig[] = [
      { exact: true, path: '/a', component: a.component, layout: Layout },
      { exact: true, path: '/b', component: b.component, layout: Layout },
    ]

    render(<MemoryRouter initialEntries={['/a']}>{renderRoutes(routes)}</MemoryRouter>)
    await a.resolve()
    expect(screen.getByText('Page A')).toBeTruthy()

    fireEvent.click(screen.getByText('go b'))
    expect(screen.getByTestId('sidebar')).toBeTruthy()
    expect(isHidden('sidebar')).toBe(false)

    await b.resolve()
    expect(screen.getByText('Page B')).toBeTruthy()
    expect(screen.getByTestId('sidebar')).toBeTruthy()
  })
})

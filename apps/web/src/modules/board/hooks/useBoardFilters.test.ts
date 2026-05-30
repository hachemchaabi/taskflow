import { renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Card } from '@/shared/types'
import { useBoardFilters } from './useBoardFilters'

const card = (overrides: Partial<Card> = {}): Card => ({
  id: 'c1',
  title: 'Ship the release',
  description: null,
  position: 0,
  priority: 'NONE',
  startDate: null,
  endDate: null,
  assignees: [],
  labels: [],
  ...overrides,
})

describe('useBoardFilters', () => {
  it('matches everything when no filter is active', () => {
    const { result } = renderHook(() => useBoardFilters())
    expect(result.current.activeCount).toBe(0)
    expect(result.current.matches(card())).toBe(true)
  })

  it('filters by case-insensitive title substring', () => {
    const { result } = renderHook(() => useBoardFilters())
    act(() => result.current.setQuery('SHIP'))
    expect(result.current.activeCount).toBe(1)
    expect(result.current.matches(card({ title: 'Ship it' }))).toBe(true)
    expect(result.current.matches(card({ title: 'Plan the sprint' }))).toBe(false)
  })

  it('filters by priority, OR within the dimension', () => {
    const { result } = renderHook(() => useBoardFilters())
    act(() => result.current.togglePriority('HIGH'))
    act(() => result.current.togglePriority('LOW'))
    expect(result.current.activeCount).toBe(2)
    expect(result.current.matches(card({ priority: 'HIGH' }))).toBe(true)
    expect(result.current.matches(card({ priority: 'LOW' }))).toBe(true)
    expect(result.current.matches(card({ priority: 'MEDIUM' }))).toBe(false)
  })

  it('filters by label and assignee membership', () => {
    const { result } = renderHook(() => useBoardFilters())
    act(() => result.current.toggleLabel('lbl1'))
    act(() => result.current.toggleAssignee('user1'))
    const match = card({
      labels: [{ id: 'lbl1', name: 'Bug', color: '#f00' }],
      assignees: [{ id: 'user1', name: 'Ada', avatarUrl: null }],
    })
    expect(result.current.matches(match)).toBe(true)
    expect(
      result.current.matches(card({ labels: [{ id: 'lbl1', name: 'Bug', color: '#f00' }] })),
    ).toBe(false)
  })

  it('combines dimensions with AND', () => {
    const { result } = renderHook(() => useBoardFilters())
    act(() => result.current.setQuery('ship'))
    act(() => result.current.togglePriority('HIGH'))
    expect(result.current.matches(card({ title: 'Ship it', priority: 'HIGH' }))).toBe(true)
    expect(result.current.matches(card({ title: 'Ship it', priority: 'LOW' }))).toBe(false)
  })

  it('toggles a value off and clears all filters', () => {
    const { result } = renderHook(() => useBoardFilters())
    act(() => result.current.togglePriority('HIGH'))
    act(() => result.current.togglePriority('HIGH'))
    expect(result.current.priorities.has('HIGH')).toBe(false)

    act(() => result.current.setQuery('ship'))
    act(() => result.current.toggleLabel('lbl1'))
    act(() => result.current.clear())
    expect(result.current.activeCount).toBe(0)
    expect(result.current.query).toBe('')
  })
})

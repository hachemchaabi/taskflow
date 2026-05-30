import { describe, it, expect } from 'vitest'
import { formatDateRange, matchStatus } from './utils'

describe('formatDateRange', () => {
  it('returns null when both dates are missing', () => {
    expect(formatDateRange(null, null)).toBeNull()
  })
  it('formats a single end date', () => {
    expect(formatDateRange(null, '2026-06-05T00:00:00.000Z')).toMatch(/Jun/)
  })
  it('formats a start → end range', () => {
    const out = formatDateRange('2026-06-01T00:00:00.000Z', '2026-06-05T00:00:00.000Z')
    expect(out).toContain('→')
  })
})

describe('matchStatus', () => {
  it('matches the seeded statuses regardless of case and spacing', () => {
    expect(matchStatus('To Do')).toBe('todo')
    expect(matchStatus(' todo ')).toBe('todo')
    expect(matchStatus('In Progress')).toBe('in-progress')
    expect(matchStatus('in-progress')).toBe('in-progress')
    expect(matchStatus('DONE')).toBe('done')
  })
  it('returns null for custom list titles', () => {
    expect(matchStatus('Backlog')).toBeNull()
    expect(matchStatus('Website Sprint')).toBeNull()
  })
})

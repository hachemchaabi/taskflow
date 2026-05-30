import { describe, it, expect } from 'vitest'
import { greetingFor, firstName } from './utils'

describe('greetingFor', () => {
  it('greets morning before noon', () => {
    expect(greetingFor(new Date('2026-05-30T08:00:00'))).toBe('Good morning')
  })

  it('greets afternoon from noon to 17:59', () => {
    expect(greetingFor(new Date('2026-05-30T12:00:00'))).toBe('Good afternoon')
    expect(greetingFor(new Date('2026-05-30T17:59:00'))).toBe('Good afternoon')
  })

  it('greets evening from 18:00', () => {
    expect(greetingFor(new Date('2026-05-30T18:00:00'))).toBe('Good evening')
    expect(greetingFor(new Date('2026-05-30T23:30:00'))).toBe('Good evening')
  })
})

describe('firstName', () => {
  it('returns the first token of a full name', () => {
    expect(firstName('Ada Lovelace')).toBe('Ada')
  })

  it('handles single names and extra whitespace', () => {
    expect(firstName('  Grace   Hopper ')).toBe('Grace')
    expect(firstName('Linus')).toBe('Linus')
  })
})

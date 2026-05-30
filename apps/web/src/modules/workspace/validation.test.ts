import { describe, it, expect } from 'vitest'
import { isValidSlug, slugify, slugifyInput } from './validation'

describe('slugify', () => {
  it('lowercases, hyphenates, and trims stray separators', () => {
    expect(slugify('  My New Team!! ')).toBe('my-new-team')
    expect(slugify('Acme & Co.')).toBe('acme-co')
  })
})

describe('slugifyInput', () => {
  it('keeps a single trailing hyphen so multi-word slugs can be typed', () => {
    expect(slugifyInput('my ')).toBe('my-')
    expect(slugifyInput('my-team')).toBe('my-team')
  })

  it('collapses repeats and strips leading hyphens', () => {
    expect(slugifyInput('--my  team')).toBe('my-team')
  })
})

describe('isValidSlug', () => {
  it('accepts valid slugs', () => {
    expect(isValidSlug('my-team')).toBe(true)
    expect(isValidSlug('team1')).toBe(true)
  })

  it('rejects too-short, trailing-hyphen, and bad-character slugs', () => {
    expect(isValidSlug('a')).toBe(false)
    expect(isValidSlug('my-')).toBe(false)
    expect(isValidSlug('My-Team')).toBe(false)
    expect(isValidSlug('')).toBe(false)
  })
})

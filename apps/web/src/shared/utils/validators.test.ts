import { describe, expect, it } from 'vitest'
import { isNonEmpty, isValidEmail, isValidPassword } from './validators'

describe('validators', () => {
  it('accepts valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('  trimmed@test.io  ')).toBe(true)
  })

  it('rejects invalid emails', () => {
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('missing@domain')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })

  it('requires passwords of at least 8 characters', () => {
    expect(isValidPassword('1234567')).toBe(false)
    expect(isValidPassword('12345678')).toBe(true)
  })

  it('detects non-empty strings', () => {
    expect(isNonEmpty('  ')).toBe(false)
    expect(isNonEmpty('hi')).toBe(true)
  })
})

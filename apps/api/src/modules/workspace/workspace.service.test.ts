import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../prisma/prisma.service.js', () => ({
  prisma: {
    workspaceMember: { findUnique: vi.fn() },
    workspace: { findUnique: vi.fn() },
  },
}))

import { prisma } from '../../prisma/prisma.service.js'
import { assertWorkspaceRole, slugify, generateUniqueSlug } from './workspace.service.js'
import { HttpError } from '../../common/errorHandler.js'

const findUnique = prisma.workspaceMember.findUnique as unknown as ReturnType<typeof vi.fn>
const wsFindUnique = prisma.workspace.findUnique as unknown as ReturnType<typeof vi.fn>

describe('assertWorkspaceRole', () => {
  beforeEach(() => findUnique.mockReset())

  it('returns the role when the user is a member with an allowed role', async () => {
    findUnique.mockResolvedValue({ role: 'ADMIN' })
    await expect(assertWorkspaceRole('u1', 'w1', ['OWNER', 'ADMIN'])).resolves.toBe('ADMIN')
  })

  it('throws 403 when the user is not a member', async () => {
    findUnique.mockResolvedValue(null)
    await expect(assertWorkspaceRole('u1', 'w1', ['MEMBER'])).rejects.toBeInstanceOf(HttpError)
  })

  it('throws 403 when the role is not allowed', async () => {
    findUnique.mockResolvedValue({ role: 'MEMBER' })
    await expect(assertWorkspaceRole('u1', 'w1', ['OWNER'])).rejects.toBeInstanceOf(HttpError)
  })
})

describe('slugify', () => {
  it('lowercases, hyphenates, and trims stray separators', () => {
    expect(slugify('  My New Team!! ')).toBe('my-new-team')
    expect(slugify('Acme & Co.')).toBe('acme-co')
    expect(slugify('already-good')).toBe('already-good')
  })

  it('returns an empty string when there are no alphanumerics', () => {
    expect(slugify('###')).toBe('')
  })
})

describe('generateUniqueSlug', () => {
  beforeEach(() => wsFindUnique.mockReset())

  it('returns the base slug when it is free', async () => {
    wsFindUnique.mockResolvedValue(null)
    await expect(generateUniqueSlug('My Team')).resolves.toBe('my-team')
  })

  it('appends a numeric suffix until it finds a free slug', async () => {
    wsFindUnique
      .mockResolvedValueOnce({ id: 'a' })
      .mockResolvedValueOnce({ id: 'b' })
      .mockResolvedValueOnce(null)
    await expect(generateUniqueSlug('My Team')).resolves.toBe('my-team-3')
  })

  it('falls back to "workspace" when the name has no alphanumerics', async () => {
    wsFindUnique.mockResolvedValue(null)
    await expect(generateUniqueSlug('###')).resolves.toBe('workspace')
  })
})

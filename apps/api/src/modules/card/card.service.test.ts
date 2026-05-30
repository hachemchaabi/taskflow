import { describe, it, expect, vi } from 'vitest'

vi.mock('../../prisma/prisma.service.js', () => ({ prisma: {} }))
vi.mock('../workspace/workspace.service.js', () => ({ assertWorkspaceRole: vi.fn() }))

import { parseMentionIds } from './card.service.js'

describe('parseMentionIds', () => {
  it('extracts user ids from @[id] tokens', () => {
    expect(parseMentionIds('Hey @[clx123abc] and @[cly456def] take a look')).toEqual([
      'clx123abc',
      'cly456def',
    ])
  })

  it('returns an empty array when there are no tokens', () => {
    expect(parseMentionIds('just a plain comment')).toEqual([])
  })

  it('de-duplicates a user mentioned more than once', () => {
    expect(parseMentionIds('@[clx123abc] ping @[clx123abc] again')).toEqual(['clx123abc'])
  })

  it('ignores a bare @name that is not a token', () => {
    expect(parseMentionIds('email me @ alex or @alex')).toEqual([])
  })
})

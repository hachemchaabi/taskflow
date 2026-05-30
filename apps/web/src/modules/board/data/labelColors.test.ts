import { describe, it, expect } from 'vitest'
import { LABEL_PALETTE, nextLabelColor } from './labelColors'
import type { Label } from '@/shared/types'

describe('nextLabelColor', () => {
  it('returns the first palette color when no labels exist', () => {
    expect(nextLabelColor([])).toBe(LABEL_PALETTE[0])
  })

  it('returns the first unused palette color', () => {
    const used: Label[] = [{ id: '1', name: 'a', color: LABEL_PALETTE[0] }]
    expect(nextLabelColor(used)).toBe(LABEL_PALETTE[1])
  })

  it('cycles back to the start when all colors are used', () => {
    const used: Label[] = LABEL_PALETTE.map((color, i) => ({ id: String(i), name: 'x', color }))
    expect(nextLabelColor(used)).toBe(LABEL_PALETTE[0])
  })
})

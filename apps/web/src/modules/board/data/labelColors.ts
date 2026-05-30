import type { Label } from '@/shared/types'

export const LABEL_PALETTE = [
  '#3ba6f1',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#a855f7',
  '#14b8a6',
] as const

export function nextLabelColor(existing: Label[]): string {
  const used = new Set(existing.map((l) => l.color))
  const free = LABEL_PALETTE.find((c) => !used.has(c))
  return free ?? LABEL_PALETTE[existing.length % LABEL_PALETTE.length]
}

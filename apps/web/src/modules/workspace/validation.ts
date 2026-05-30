import { WORKSPACE_SLUG_MAX, WORKSPACE_SLUG_MIN } from './constants'

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function slugifyInput(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+/, '')
}

export function isValidSlug(slug: string): boolean {
  return (
    slug.length >= WORKSPACE_SLUG_MIN && slug.length <= WORKSPACE_SLUG_MAX && SLUG_RE.test(slug)
  )
}

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { CommentMention } from '@/shared/types'
import { CommentBody } from './CommentBody'

const alice: CommentMention = { user: { id: 'ualice', name: 'Alice Martin', avatarUrl: null } }

describe('CommentBody', () => {
  it('renders plain text untouched', () => {
    render(<CommentBody body="just a plain comment" mentions={[]} />)
    expect(screen.getByText('just a plain comment')).toBeInTheDocument()
  })

  it('resolves a @[id] token to the mentioned name', () => {
    render(<CommentBody body="Hey @[ualice] please review" mentions={[alice]} />)
    expect(screen.getByText('@Alice Martin')).toBeInTheDocument()
    expect(screen.getByText(/please review/)).toBeInTheDocument()
  })

  it('labels the viewer as "@Me"', () => {
    render(<CommentBody body="ping @[ualice]" mentions={[alice]} currentUserId="ualice" />)
    expect(screen.getByText('@Me')).toBeInTheDocument()
    expect(screen.queryByText('@Alice Martin')).not.toBeInTheDocument()
  })

  it('degrades an unresolved token to @unknown', () => {
    render(<CommentBody body="ping @[ghost]" mentions={[]} />)
    expect(screen.getByText('@unknown')).toBeInTheDocument()
  })
})

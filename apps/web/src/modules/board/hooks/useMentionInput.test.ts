import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { BoardMember } from '@/shared/types'
import { useMentionInput } from './useMentionInput'

const members: BoardMember[] = [
  {
    id: 'bm1',
    userId: 'ualice',
    role: 'MEMBER',
    user: { id: 'ualice', name: 'Alice Martin', email: 'alice@x.io', avatarUrl: null },
  },
  {
    id: 'bm2',
    userId: 'ubob',
    role: 'MEMBER',
    user: { id: 'ubob', name: 'Bob Chen', email: 'bob@x.io', avatarUrl: null },
  },
]

function change(value: string, caret = value.length) {
  const target = { value, selectionStart: caret, focus() {}, setSelectionRange() {} }
  return { target } as unknown as React.ChangeEvent<HTMLTextAreaElement>
}

describe('useMentionInput', () => {
  it('opens and filters suggestions for the active @query', () => {
    const { result } = renderHook(() => useMentionInput(members))

    act(() => result.current.onChange(change('Hey @al')))

    expect(result.current.open).toBe(true)
    expect(result.current.suggestions.map((m) => m.userId)).toEqual(['ualice'])
  })

  it('shows all members right after typing a bare "@"', () => {
    const { result } = renderHook(() => useMentionInput(members))
    act(() => result.current.onChange(change('@')))
    expect(result.current.suggestions).toHaveLength(2)
  })

  it('closes when the query matches nobody', () => {
    const { result } = renderHook(() => useMentionInput(members))
    act(() => result.current.onChange(change('Hey @zzz')))
    expect(result.current.open).toBe(false)
  })

  it('inserts a mention and serializes it to a @[userId] token', () => {
    const { result } = renderHook(() => useMentionInput(members))

    act(() => result.current.onChange(change('Hey @al')))
    act(() => result.current.select(members[0]))

    expect(result.current.value).toBe('Hey @Alice Martin ')
    expect(result.current.open).toBe(false)
    expect(result.current.buildBody()).toBe('Hey @[ualice] ')
  })

  it('inserts the current user as "@Me" but still tokenizes their real id', () => {
    const { result } = renderHook(() => useMentionInput(members, 'ualice'))

    act(() => result.current.onChange(change('@al')))
    act(() => result.current.select(members[0]))

    expect(result.current.value).toBe('@Me ')
    expect(result.current.buildBody()).toBe('@[ualice] ')
  })

  it('keeps plain text untouched in the built body', () => {
    const { result } = renderHook(() => useMentionInput(members))
    act(() => result.current.onChange(change('no mentions here')))
    expect(result.current.buildBody()).toBe('no mentions here')
  })

  it('drops a mention when the user edits inside its text', () => {
    const { result } = renderHook(() => useMentionInput(members))

    act(() => result.current.onChange(change('@al')))
    act(() => result.current.select(members[0]))
    act(() => result.current.onChange(change('@Alice Marti ')))

    expect(result.current.buildBody()).toBe('@Alice Marti ')
  })

  it('shifts an earlier mention token when text is appended after it', () => {
    const { result } = renderHook(() => useMentionInput(members))

    act(() => result.current.onChange(change('@al')))
    act(() => result.current.select(members[0]))
    act(() => result.current.onChange(change('@Alice Martin please review')))

    expect(result.current.buildBody()).toBe('@[ualice] please review')
  })

  it('seeds an editor from a stored body and round-trips it back to tokens', () => {
    const init = {
      body: 'Hey @[ualice] and @[ubob], thoughts?',
      nameById: new Map([
        ['ualice', 'Alice Martin'],
        ['ubob', 'Bob Chen'],
      ]),
    }
    const { result } = renderHook(() => useMentionInput(members, 'uviewer', init))

    expect(result.current.value).toBe('Hey @Alice Martin and @Bob Chen, thoughts?')
    expect(result.current.buildBody()).toBe('Hey @[ualice] and @[ubob], thoughts?')
  })

  it('seeds the current user as "@Me"', () => {
    const init = { body: 'note @[ualice]', nameById: new Map([['ualice', 'Alice Martin']]) }
    const { result } = renderHook(() => useMentionInput(members, 'ualice', init))
    expect(result.current.value).toBe('note @Me')
    expect(result.current.buildBody()).toBe('note @[ualice]')
  })

  it('resets value and mentions', () => {
    const { result } = renderHook(() => useMentionInput(members))
    act(() => result.current.onChange(change('@al')))
    act(() => result.current.select(members[0]))
    act(() => result.current.reset())

    expect(result.current.value).toBe('')
    expect(result.current.buildBody()).toBe('')
  })
})

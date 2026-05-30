import { type ComponentProps, type KeyboardEvent, type ReactNode, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '@/shared/ui/input-group'
import { Textarea } from '@/shared/ui/textarea'
import type { UseMentionInput } from '../hooks/useMentionInput'
import { initials, mentionName } from '../utils'

interface Props {
  controller: UseMentionInput
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
  onSubmit?: () => void
  footer?: ReactNode
}

export function MentionTextarea({
  controller,
  placeholder,
  disabled,
  autoFocus,
  onSubmit,
  footer,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!autoFocus) return
    const ta = wrapperRef.current?.querySelector('textarea')
    if (!ta) return
    ta.focus()
    ta.setSelectionRange(ta.value.length, ta.value.length)
  }, [autoFocus])

  const {
    value,
    currentUserId,
    onChange,
    onKeyDown,
    suggestions,
    open,
    activeIndex,
    setActiveIndex,
    select,
    listboxId,
  } = controller

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (onSubmit && (e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      onSubmit()
      return
    }
    onKeyDown(e)
  }

  const controlProps = {
    value,
    onChange,
    onKeyDown: handleKeyDown,
    placeholder,
    disabled,
    rows: 2,
    role: 'combobox',
    'aria-expanded': open,
    'aria-autocomplete': 'list',
    'aria-controls': open ? listboxId : undefined,
    'aria-activedescendant': open ? `${listboxId}-${activeIndex}` : undefined,
  } satisfies ComponentProps<'textarea'>

  return (
    <div className="relative" ref={wrapperRef}>
      {footer ? (
        <InputGroup className="flex-col items-stretch">
          <InputGroupTextarea {...controlProps} />
          <InputGroupAddon align="block-end" className="justify-end">
            {footer}
          </InputGroupAddon>
        </InputGroup>
      ) : (
        <Textarea {...controlProps} />
      )}

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Mention a board member"
          className="absolute inset-x-0 bottom-full z-50 mb-1 overflow-hidden rounded-lg border bg-popover px-1 py-1 text-popover-foreground shadow-md/5"
        >
          {suggestions.map((m, i) => (
            <li
              key={m.userId}
              id={`${listboxId}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault()
                select(m)
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm',
                i === activeIndex ? 'bg-accent text-accent-foreground' : 'text-foreground',
              )}
            >
              <Avatar className="size-6 rounded-md text-[10px]">
                {m.user.avatarUrl ? <AvatarImage src={m.user.avatarUrl} alt={m.user.name} /> : null}

                <AvatarFallback className="rounded-md">{initials(m.user.name)}</AvatarFallback>
              </Avatar>

              <span className="truncate font-medium">
                {mentionName(m.userId, m.user.name, currentUserId)}
              </span>

              <span className="truncate text-xs text-muted-foreground">{m.user.email}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

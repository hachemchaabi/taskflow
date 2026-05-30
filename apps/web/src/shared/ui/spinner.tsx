import type React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const spinnerVariants = cva('inline-block size-4 shrink-0 animate-spin rounded-full border-2', {
  defaultVariants: {
    variant: 'current',
  },
  variants: {
    variant: {
      accent: 'border-primary/20 border-t-primary',
      current: 'border-current border-t-transparent',
    },
  },
})

export interface SpinnerProps
  extends React.ComponentProps<'span'>, VariantProps<typeof spinnerVariants> {}

export function Spinner({ className, variant, ...props }: SpinnerProps): React.ReactElement {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(spinnerVariants({ variant }), className)}
      {...props}
    />
  )
}

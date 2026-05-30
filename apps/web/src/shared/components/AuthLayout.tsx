import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '@/shared/assets/brand-logo.svg?react'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center gap-3 p-6">
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(125% 125% at 50% 10%, var(--background) 40%, var(--color-chartwell-blue) 100%)',
        }}
      />

      <Link to="/login" className="relative z-10" aria-label="TaskFlow">
        <BrandLogo className="h-8 w-auto" />
      </Link>

      <div className="relative z-10 flex w-full flex-col items-center gap-6">{children}</div>
    </div>
  )
}

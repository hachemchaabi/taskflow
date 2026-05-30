import { cn } from '@/lib/utils'

export const navButtonClass = cn(
  'relative isolate text-sidebar-foreground/80 transition-colors duration-200 ease-out [&_svg]:transition-[color,scale,rotate] [&_svg]:duration-200 [&_svg]:ease-out',
  'before:absolute before:inset-0 before:-z-10 before:rounded-lg before:bg-linear-to-r before:from-sidebar before:to-sidebar-primary/50 before:opacity-0 before:transition-opacity before:duration-200 before:ease-out',
  'hover:before:opacity-100 hover:[&_svg]:text-primary hover:[&_svg]:scale-110 hover:[&_svg]:rotate-6',
  'active:before:opacity-100 active:[&_svg]:text-primary',
  'data-[active=true]:before:opacity-100 data-[active=true]:[&_svg]:text-primary',
)

import * as Iconsax from 'iconsax-react'
import type { ComponentPropsWithoutRef } from 'react'

export type IconName = keyof typeof Iconsax

type Props = {
  name: IconName
  size?: number | string
  color?: string
} & Omit<ComponentPropsWithoutRef<'svg'>, 'name' | 'color'>

export const Icon = ({ name, size = 20, color, ...props }: Props) => {
  const Component = Iconsax[name] as React.ComponentType<
    {
      size?: number | string
      color?: string
      variant?: 'Linear' | 'Bold' | 'Outline' | 'TwoTone' | 'Bulk' | 'Broken'
    } & ComponentPropsWithoutRef<'svg'>
  >
  return <Component size={size} color={color} variant="Bulk" {...props} />
}

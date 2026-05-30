import { Icon } from '@/shared/ui/Icon'
import { Icons } from '@/lib/Icons'
import { Tabs, TabsList, TabsTab } from '@/shared/ui/tabs'
import { useTheme } from '../hooks/useTheme'
import type { Theme } from '../data/themeSlice'

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Icons.ui.sun },
  { value: 'dark', label: 'Dark', icon: Icons.ui.moon },
  { value: 'system', label: 'System', icon: Icons.ui.computer },
] as const

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <Tabs value={theme} onValueChange={(value) => setTheme(value as Theme)}>
      <TabsList className="w-full">
        {THEME_OPTIONS.map((option) => (
          <TabsTab key={option.value} value={option.value} className="h-7 text-xs sm:h-7">
            <Icon name={option.icon} size={14} />
            {option.label}
          </TabsTab>
        ))}
      </TabsList>
    </Tabs>
  )
}

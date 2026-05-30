import { Card } from '@/shared/ui/card'
import { Switch } from '@/shared/ui/switch'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/shared/ui/empty'
import { Icon } from '@/shared/ui/Icon'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Icons } from '@/lib/Icons'
import { Loading } from '@/shared/components/Loading'
import { SectionHeader } from '@/shared/components/SectionHeader'
import { useFetch } from '@/shared/hooks/useFetch'
import { boardsApi } from '@/modules/board/data/boardApi'
import { useWorkspace } from '@/modules/workspace/hooks/useWorkspace'
import { useNotificationPreferences } from '../hooks/useNotificationPreferences'
import { DND_PRESETS, NOTIFICATION_TOGGLES } from '../constants'

export default function NotificationPreferencesPage() {
  const { activeWorkspace } = useWorkspace()
  const { prefs, loading, toggle, setDnd, muteWorkspace, muteBoard, unmute } =
    useNotificationPreferences()

  const { data: boards } = useFetch(
    (signal) => boardsApi.list(activeWorkspace!.id, signal),
    [activeWorkspace?.id],
    { enabled: !!activeWorkspace, cacheKey: `boards:${activeWorkspace?.id}` },
  )

  if (loading || !prefs) return <Loading label="Loading notification settings…" />

  const dndActive = prefs.dndUntil ? new Date(prefs.dndUntil).getTime() > Date.now() : false
  const workspaceMuted =
    !!activeWorkspace && prefs.mutes.some((m) => m.workspaceId === activeWorkspace.id)
  const mutedBoardIds = new Set(
    prefs.mutes.map((m) => m.boardId).filter((id): id is string => Boolean(id)),
  )
  const muteableBoards = (boards ?? []).filter((b) => !mutedBoardIds.has(b.id))

  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold text-slate-text">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Choose what reaches your Inbox and when you want quiet.
        </p>
      </header>

      <Card className="space-y-5 p-6">
        <SectionHeader
          icon={Icons.communication.notification}
          title="What you get notified about"
          description="Turn individual in-app notifications on or off."
        />
        <ul className="-mx-6 divide-y divide-stone-border">
          {NOTIFICATION_TOGGLES.map((t) => (
            <li key={t.key} className="flex items-center justify-between gap-4 px-6 py-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-slate-text">{t.label}</p>
                <p className="text-sm text-muted-foreground">{t.description}</p>
              </div>
              <Switch
                checked={prefs[t.key]}
                onCheckedChange={(checked) => toggle(t.key, checked)}
                aria-label={t.label}
              />
            </li>
          ))}
        </ul>
      </Card>

      <Card className="space-y-4 p-6">
        <SectionHeader
          icon={Icons.ui.moon}
          title="Do not disturb"
          description="Silence all notifications until a time you choose."
        />
        {dndActive ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Silenced until{' '}
              <span className="font-medium text-slate-text">
                {new Date(prefs.dndUntil!).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </p>
            <Button variant="ghost" size="sm" onClick={() => void setDnd(null)}>
              Turn off
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {DND_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() =>
                  void setDnd(new Date(Date.now() + preset.minutes * 60_000).toISOString())
                }
              >
                {preset.label}
              </Button>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-4 p-6">
        <SectionHeader
          icon={Icons.ui.eyeOff}
          title="Muted boards & workspaces"
          description="Silence everything from a specific board or workspace."
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!activeWorkspace || workspaceMuted}
            onClick={() => activeWorkspace && void muteWorkspace(activeWorkspace.id)}
          >
            <Icon name={Icons.ui.building} size={16} aria-hidden="true" />
            {workspaceMuted ? 'Workspace muted' : 'Mute this workspace'}
          </Button>

          <Select
            value=""
            onValueChange={(id) => id && void muteBoard(id)}
            disabled={!activeWorkspace || muteableBoards.length === 0}
          >
            <SelectTrigger size="sm" className="w-56" aria-label="Mute a board">
              <span className="flex items-center gap-2 text-ash-gray">
                <Icon name={Icons.navigation.board} size={16} aria-hidden="true" />
                <SelectValue
                  placeholder={
                    !activeWorkspace
                      ? 'No workspace'
                      : muteableBoards.length === 0
                        ? 'All boards muted'
                        : 'Mute a board…'
                  }
                />
              </span>
            </SelectTrigger>
            <SelectContent>
              {muteableBoards.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {prefs.mutes.length > 0 && (
            <Badge variant="outline" className="ms-auto shrink-0">
              {prefs.mutes.length} muted
            </Badge>
          )}
        </div>

        {prefs.mutes.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Icon name={Icons.ui.eyeOff} aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>Nothing muted</EmptyTitle>
              <EmptyDescription>
                Mute a board or workspace to stop its notifications reaching your Inbox.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="divide-y divide-stone-border overflow-hidden rounded-lg border border-stone-border">
            {prefs.mutes.map((m) => {
              const isWorkspace = !!m.workspaceId
              const name = m.workspace?.name ?? m.board?.title ?? 'Unknown'
              return (
                <li
                  key={m.id}
                  className="flex min-h-12 items-center justify-between gap-3 px-3 py-2 transition-colors hover:bg-canvas-fog"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-ash-gray">
                      <Icon
                        name={isWorkspace ? Icons.ui.building : Icons.navigation.board}
                        size={16}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-text">
                        {name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {isWorkspace ? 'Workspace' : 'Board'}
                      </span>
                    </span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void unmute(m.id)}
                    aria-label={`Unmute ${name}`}
                  >
                    <Icon name={Icons.ui.eye} size={16} aria-hidden="true" />
                    Unmute
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </section>
  )
}

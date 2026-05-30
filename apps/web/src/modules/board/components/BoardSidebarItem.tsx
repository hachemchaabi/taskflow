import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Icon } from '@/shared/ui/Icon'
import { Icons } from '@/lib/Icons'
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from '@/shared/ui/menu'
import { SidebarMenuAction, SidebarMenuButton, SidebarMenuItem } from '@/shared/ui/sidebar'
import type { BoardSummary } from '@/shared/types'
import { navButtonClass } from '@/shared/components/sidebarNavClass'
import { EditListDialog } from './EditListDialog'
import { DeleteListDialog } from './DeleteListDialog'
import { ShareListDialog } from './ShareListDialog'
import { ListIcon } from './ListIcon'

type DialogKind = 'edit' | 'delete' | 'share' | null

interface Props {
  board: BoardSummary
  isActive: boolean
  onChanged: () => void
}

export function BoardSidebarItem({ board, isActive, onChanged }: Props) {
  const [dialog, setDialog] = useState<DialogKind>(null)
  const close = () => setDialog(null)

  const canManage = board.role === 'OWNER' || board.role === 'ADMIN'
  const canDelete = board.role === 'OWNER'

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={board.title}
        className={navButtonClass}
        render={<NavLink to={`/boards/${board.id}`} end />}
      >
        <ListIcon board={board} />
        <span>{board.title}</span>
      </SidebarMenuButton>

      {canManage && (
        <>
          <Menu>
            <SidebarMenuAction
              showOnHover
              aria-label="List actions"
              className="cursor-pointer hover:bg-transparent"
              render={<MenuTrigger />}
            >
              <Icon name={Icons.ui.dotsHorizontal} size={16} color="currentColor" />
            </SidebarMenuAction>

            <MenuPopup side="right" align="start" className="min-w-40">
              <MenuItem onClick={() => setDialog('share')}>
                <Icon name={Icons.ui.share} size={16} color="currentColor" />
                Share
              </MenuItem>

              <MenuItem onClick={() => setDialog('edit')}>
                <Icon name={Icons.actions.edit} size={16} color="currentColor" />
                Edit
              </MenuItem>

              {canDelete && (
                <>
                  <MenuSeparator />

                  <MenuItem variant="destructive" onClick={() => setDialog('delete')}>
                    <Icon name={Icons.actions.delete} size={16} color="currentColor" />
                    Delete
                  </MenuItem>
                </>
              )}
            </MenuPopup>
          </Menu>

          <EditListDialog
            board={board}
            open={dialog === 'edit'}
            onOpenChange={(o) => !o && close()}
            onChanged={onChanged}
          />

          {canDelete && (
            <DeleteListDialog
              board={board}
              open={dialog === 'delete'}
              onOpenChange={(o) => !o && close()}
              onChanged={onChanged}
            />
          )}

          <ShareListDialog
            board={board}
            open={dialog === 'share'}
            onOpenChange={(o) => !o && close()}
          />
        </>
      )}
    </SidebarMenuItem>
  )
}

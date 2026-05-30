import type { MemberRole } from '../../shared/types'

export const WORKSPACE_NAME_MIN = 2
export const WORKSPACE_NAME_MAX = 60
export const WORKSPACE_SLUG_MIN = 2
export const WORKSPACE_SLUG_MAX = 60
export const WORKSPACE_DESCRIPTION_MAX = 280
export const WORKSPACE_LOGO_MAX_BYTES = 2 * 1024 * 1024
export const WORKSPACE_LOGO_MIME = ['image/png', 'image/jpeg', 'image/svg+xml']

export const DEFAULT_ROLE_OPTIONS = [
  { value: 'MEMBER', label: 'Member' },
  { value: 'ADMIN', label: 'Admin' },
] as const satisfies readonly { value: Extract<MemberRole, 'ADMIN' | 'MEMBER'>; label: string }[]

export const WORKSPACE_MESSAGES = {
  saved: 'Workspace settings saved.',
  saveError: 'Could not save workspace settings.',
  logoError: 'Could not upload the logo.',
  logoTypeError: 'Logo must be a PNG, JPG or SVG image.',
  logoSizeError: 'Logo must be 2MB or smaller.',
  ownershipTransferred: 'Ownership transferred.',
  roleUpdated: 'Member role updated.',
  roleUpdateError: 'Could not update the member’s role.',
  memberRemoved: 'Member removed.',
  memberRemoveError: 'Could not remove the member.',
  inviteRoleUpdated: 'Invite role updated.',
  inviteRoleUpdateError: 'Could not update the invite’s role.',
  inviteRevoked: 'Invitation revoked.',
  inviteRevokeError: 'Could not revoke the invitation.',
  deleted: 'Workspace deleted.',
  deleteError: 'Could not delete the workspace.',
} as const

import { Router } from 'express'
import multer from 'multer'
import { asyncHandler } from '../../common/asyncHandler.js'
import {
  checkSlugAvailability,
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  getWorkspaceActivity,
  listWorkspaces,
  removeLogo,
  removeMember,
  transferOwnership,
  updateMemberRole,
  updateWorkspace,
  uploadLogo,
  LOGO_MAX_BYTES,
} from './workspace.controller.js'
import {
  acceptInvite,
  createInvite,
  declineInvite,
  listMyInvites,
  listWorkspaceInvites,
  revokeInvite,
  updateInvite,
} from './invite.controller.js'

const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LOGO_MAX_BYTES },
})

export const workspaceRoutes = Router()
workspaceRoutes.get('/', asyncHandler(listWorkspaces))
workspaceRoutes.get('/slug-available', asyncHandler(checkSlugAvailability))
workspaceRoutes.post('/', asyncHandler(createWorkspace))
workspaceRoutes.get('/:id', asyncHandler(getWorkspace))
workspaceRoutes.get('/:id/activity', asyncHandler(getWorkspaceActivity))
workspaceRoutes.patch('/:id', asyncHandler(updateWorkspace))
workspaceRoutes.put('/:id/logo', logoUpload.single('logo'), asyncHandler(uploadLogo))
workspaceRoutes.delete('/:id/logo', asyncHandler(removeLogo))
workspaceRoutes.delete('/:id', asyncHandler(deleteWorkspace))
workspaceRoutes.post('/:id/transfer-ownership', asyncHandler(transferOwnership))
workspaceRoutes.patch('/:id/members/:userId', asyncHandler(updateMemberRole))
workspaceRoutes.delete('/:id/members/:userId', asyncHandler(removeMember))
workspaceRoutes.post('/:id/invites', asyncHandler(createInvite))
workspaceRoutes.get('/:id/invites', asyncHandler(listWorkspaceInvites))
workspaceRoutes.patch('/:id/invites/:inviteId', asyncHandler(updateInvite))
workspaceRoutes.delete('/:id/invites/:inviteId', asyncHandler(revokeInvite))

export const inviteRoutes = Router()
inviteRoutes.get('/', asyncHandler(listMyInvites))
inviteRoutes.post('/:id/accept', asyncHandler(acceptInvite))
inviteRoutes.post('/:id/decline', asyncHandler(declineInvite))

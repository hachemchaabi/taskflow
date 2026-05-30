import { Router } from 'express'
import multer from 'multer'
import {
  addBoardMember,
  createBoard,
  deleteBoard,
  getBoard,
  listBoardMembers,
  listBoards,
  removeBoardMember,
  removeIcon,
  updateBoard,
  updateBoardMemberRole,
  uploadIcon,
  ICON_MAX_BYTES,
} from './board.controller.js'
import { createCard, createLabel } from '../card/card.controller.js'
import { asyncHandler } from '../../common/asyncHandler.js'

const iconUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: ICON_MAX_BYTES },
})

export const boardRoutes = Router()

boardRoutes.get('/', asyncHandler(listBoards))
boardRoutes.post('/', asyncHandler(createBoard))
boardRoutes.get('/:id', asyncHandler(getBoard))
boardRoutes.patch('/:id', asyncHandler(updateBoard))
boardRoutes.put('/:id/icon', iconUpload.single('icon'), asyncHandler(uploadIcon))
boardRoutes.delete('/:id/icon', asyncHandler(removeIcon))
boardRoutes.delete('/:id', asyncHandler(deleteBoard))
boardRoutes.get('/:id/members', asyncHandler(listBoardMembers))
boardRoutes.post('/:id/members', asyncHandler(addBoardMember))
boardRoutes.patch('/:id/members/:userId', asyncHandler(updateBoardMemberRole))
boardRoutes.delete('/:id/members/:userId', asyncHandler(removeBoardMember))
boardRoutes.post('/:boardId/cards', asyncHandler(createCard))
boardRoutes.post('/:boardId/labels', asyncHandler(createLabel))

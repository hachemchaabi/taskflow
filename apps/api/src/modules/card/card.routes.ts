import { Router } from 'express'
import {
  addComment,
  deleteCard,
  deleteComment,
  editComment,
  getCard,
  updateCard,
} from './card.controller.js'
import { asyncHandler } from '../../common/asyncHandler.js'

export const cardRoutes = Router()

cardRoutes.get('/:id', asyncHandler(getCard))
cardRoutes.patch('/:id', asyncHandler(updateCard))
cardRoutes.delete('/:id', asyncHandler(deleteCard))
cardRoutes.post('/:id/comments', asyncHandler(addComment))
cardRoutes.patch('/:id/comments/:commentId', asyncHandler(editComment))
cardRoutes.delete('/:id/comments/:commentId', asyncHandler(deleteComment))

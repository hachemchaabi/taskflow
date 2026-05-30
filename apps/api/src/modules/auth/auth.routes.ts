import { Router } from 'express'
import multer from 'multer'
import {
  register,
  login,
  refresh,
  logout,
  me,
  updateProfile,
  uploadAvatar,
  removeAvatar,
  AVATAR_MAX_BYTES,
} from './auth.controller.js'
import { asyncHandler } from '../../common/asyncHandler.js'
import { requireAuth } from '../../common/authMiddleware.js'

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: AVATAR_MAX_BYTES },
})

export const authRoutes = Router()

authRoutes.post('/register', asyncHandler(register))
authRoutes.post('/login', asyncHandler(login))
authRoutes.post('/refresh', asyncHandler(refresh))
authRoutes.post('/logout', asyncHandler(logout))
authRoutes.get('/me', requireAuth, asyncHandler(me))
authRoutes.patch('/me', requireAuth, asyncHandler(updateProfile))
authRoutes.put('/me/avatar', requireAuth, avatarUpload.single('avatar'), asyncHandler(uploadAvatar))
authRoutes.delete('/me/avatar', requireAuth, asyncHandler(removeAvatar))

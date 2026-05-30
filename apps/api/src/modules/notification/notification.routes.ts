import { Router } from 'express'
import { asyncHandler } from '../../common/asyncHandler.js'
import {
  createMute,
  deleteAllNotifications,
  deleteMute,
  deleteNotification,
  getNotificationPreferences,
  getNotifications,
  getUnreadCount,
  patchNotificationPreferences,
  readAllNotifications,
  readNotification,
} from './notification.controller.js'

export const notificationRoutes = Router()

notificationRoutes.get('/', asyncHandler(getNotifications))
notificationRoutes.get('/unread-count', asyncHandler(getUnreadCount))
notificationRoutes.post('/read-all', asyncHandler(readAllNotifications))
notificationRoutes.delete('/', asyncHandler(deleteAllNotifications))

notificationRoutes.get('/preferences', asyncHandler(getNotificationPreferences))
notificationRoutes.patch('/preferences', asyncHandler(patchNotificationPreferences))
notificationRoutes.post('/mutes', asyncHandler(createMute))
notificationRoutes.delete('/mutes/:id', asyncHandler(deleteMute))

notificationRoutes.patch('/:id/read', asyncHandler(readNotification))
notificationRoutes.delete('/:id', asyncHandler(deleteNotification))

import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import { authRoutes } from './modules/auth/auth.routes.js'
import { boardRoutes } from './modules/board/board.routes.js'
import { workspaceRoutes, inviteRoutes } from './modules/workspace/workspace.routes.js'
import { cardRoutes } from './modules/card/card.routes.js'
import { notificationRoutes } from './modules/notification/notification.routes.js'
import { errorHandler, notFound } from './common/errorHandler.js'
import { requireAuth } from './common/authMiddleware.js'
import { env } from './config/env.js'

export const app = express()

app.use(cors({ origin: env.clientOrigin.split(','), credentials: true }))
app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/boards', requireAuth, boardRoutes)
app.use('/api/workspaces', requireAuth, workspaceRoutes)
app.use('/api/invites', requireAuth, inviteRoutes)
app.use('/api/cards', requireAuth, cardRoutes)
app.use('/api/notifications', requireAuth, notificationRoutes)

app.use(notFound)
app.use(errorHandler)

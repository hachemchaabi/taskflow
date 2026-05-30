import sharedRoutes from './sharedRoutes'
import authRoutes from '../../modules/auth/routes/authRoutes'
import boardRoutes from '../../modules/board/routes/boardRoutes'
import workspaceRoutes from '../../modules/workspace/routes/workspaceRoutes'
import notificationRoutes from '../../modules/notification/routes/notificationRoutes'

const routes = [
  ...authRoutes,
  ...boardRoutes,
  ...workspaceRoutes,
  ...notificationRoutes,
  ...sharedRoutes,
]

export default routes

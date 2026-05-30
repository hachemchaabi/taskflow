import { createServer } from 'node:http'
import { app } from './app.module.js'
import { env } from './config/env.js'
import { initRealtime } from './realtime/realtime.gateway.js'

const port = env.port

const httpServer = createServer(app)
initRealtime(httpServer)

httpServer.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})

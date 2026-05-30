import { io, type Socket } from 'socket.io-client'

export function createSocket(getToken: () => string | null): Socket {
  return io(import.meta.env.VITE_SOCKET_URL || '/', {
    autoConnect: false,
    auth: (cb) => cb({ token: getToken() ?? '' }),
  })
}

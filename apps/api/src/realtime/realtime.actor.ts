import { prisma } from '../prisma/prisma.service.js'
import type { Actor } from './realtime.events.js'

export async function loadActor(userId: string): Promise<Actor> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    })
    return user ?? { id: userId, name: 'Someone' }
  } catch {
    return { id: userId, name: 'Someone' }
  }
}

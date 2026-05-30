import type { MemberRole } from '@prisma/client'
import { prisma } from '../../prisma/prisma.service.js'
import { HttpError } from '../../common/errorHandler.js'

export async function assertBoardRole(
  userId: string,
  boardId: string,
  allowed: MemberRole[],
): Promise<MemberRole> {
  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  })
  if (!membership) throw new HttpError(403, 'You are not a member of this board')
  if (!allowed.includes(membership.role)) {
    throw new HttpError(403, 'You do not have permission to perform this action')
  }
  return membership.role
}

export async function assertNotLastBoardOwner(boardId: string, userId: string): Promise<void> {
  const target = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  })
  if (target?.role !== 'OWNER') return
  const ownerCount = await prisma.boardMember.count({ where: { boardId, role: 'OWNER' } })
  if (ownerCount <= 1) throw new HttpError(400, 'A board must have at least one owner')
}

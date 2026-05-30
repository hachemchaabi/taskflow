import type { MemberRole } from '@prisma/client'
import { prisma } from '../../prisma/prisma.service.js'
import { HttpError } from '../../common/errorHandler.js'

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function generateUniqueSlug(
  name: string,
  client: Pick<typeof prisma, 'workspace'> = prisma,
): Promise<string> {
  const base = slugify(name) || 'workspace'
  let candidate = base
  let suffix = 1
  while (await client.workspace.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    suffix += 1
    candidate = `${base}-${suffix}`
  }
  return candidate
}

export async function assertWorkspaceRole(
  userId: string,
  workspaceId: string,
  allowed: MemberRole[],
): Promise<MemberRole> {
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  })
  if (!membership) throw new HttpError(403, 'You are not a member of this workspace')
  if (!allowed.includes(membership.role)) {
    throw new HttpError(403, 'You do not have permission to perform this action')
  }
  return membership.role
}

export async function assertNotLastOwner(workspaceId: string, userId: string): Promise<void> {
  const target = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  })
  if (target?.role !== 'OWNER') return
  const ownerCount = await prisma.workspaceMember.count({
    where: { workspaceId, role: 'OWNER' },
  })
  if (ownerCount <= 1) throw new HttpError(400, 'A workspace must have at least one owner')
}

import { createNotification } from './notification.service.js'

interface CardContext {
  id: string
  title: string
  workspaceId: string
  boardId: string
}

async function fanOut(
  recipientIds: string[],
  build: (recipientId: string) => Parameters<typeof createNotification>[0],
): Promise<void> {
  const unique = [...new Set(recipientIds)]
  await Promise.all(unique.map((recipientId) => createNotification(build(recipientId))))
}

export async function notifyCardAssigned(
  actorId: string,
  actorName: string,
  recipientIds: string[],
  card: CardContext,
): Promise<void> {
  await fanOut(recipientIds, (recipientId) => ({
    recipientId,
    type: 'CARD_ASSIGNED',
    actorId,
    workspaceId: card.workspaceId,
    boardId: card.boardId,
    cardId: card.id,
    data: { title: card.title, actorName, message: `${actorName} assigned you to "${card.title}"` },
  }))
}

export async function notifyCardMoved(
  actorId: string,
  actorName: string,
  recipientIds: string[],
  card: CardContext,
  toListTitle: string,
): Promise<void> {
  await fanOut(recipientIds, (recipientId) => ({
    recipientId,
    type: 'CARD_MOVED',
    actorId,
    workspaceId: card.workspaceId,
    boardId: card.boardId,
    cardId: card.id,
    data: {
      title: card.title,
      actorName,
      message: `${actorName} moved "${card.title}" to ${toListTitle}`,
    },
  }))
}

export async function notifyStatusChanged(
  actorId: string,
  actorName: string,
  recipientIds: string[],
  card: CardContext,
  toListTitle: string,
): Promise<void> {
  await fanOut(recipientIds, (recipientId) => ({
    recipientId,
    type: 'STATUS_CHANGED',
    actorId,
    workspaceId: card.workspaceId,
    boardId: card.boardId,
    cardId: card.id,
    data: {
      title: card.title,
      actorName,
      message: `${actorName} changed "${card.title}" status to ${toListTitle}`,
    },
  }))
}

export async function notifyMention(
  actorId: string,
  actorName: string,
  recipientIds: string[],
  card: CardContext,
): Promise<void> {
  await fanOut(recipientIds, (recipientId) => ({
    recipientId,
    type: 'MENTION',
    actorId,
    workspaceId: card.workspaceId,
    boardId: card.boardId,
    cardId: card.id,
    data: {
      title: card.title,
      actorName,
      message: `${actorName} mentioned you on "${card.title}"`,
    },
  }))
}

export async function notifyCommentOnAssigned(
  actorId: string,
  actorName: string,
  recipientIds: string[],
  card: CardContext,
): Promise<void> {
  await fanOut(recipientIds, (recipientId) => ({
    recipientId,
    type: 'COMMENT_ON_ASSIGNED',
    actorId,
    workspaceId: card.workspaceId,
    boardId: card.boardId,
    cardId: card.id,
    data: { title: card.title, actorName, message: `${actorName} commented on "${card.title}"` },
  }))
}

export async function notifyWorkspaceInvite(
  actorId: string,
  inviterName: string,
  recipientId: string,
  workspace: { id: string; name: string },
): Promise<void> {
  await createNotification({
    recipientId,
    type: 'WORKSPACE_INVITE',
    actorId,
    workspaceId: workspace.id,
    data: {
      title: workspace.name,
      actorName: inviterName,
      message: `${inviterName} invited you to ${workspace.name}`,
    },
  })
}

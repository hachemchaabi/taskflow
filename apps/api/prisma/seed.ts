import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const force = process.argv.includes('--force')
  const existingUsers = await prisma.user.count()
  if (existingUsers > 0 && !force) {
    console.log(`Database already has ${existingUsers} user(s); skipping seed.`)
    return
  }

  await prisma.activity.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.card.deleteMany()
  await prisma.label.deleteMany()
  await prisma.list.deleteMany()
  await prisma.boardMember.deleteMany()
  await prisma.board.deleteMany()
  await prisma.workspaceInvite.deleteMany()
  await prisma.workspaceMember.deleteMany()
  await prisma.workspace.deleteMany()
  await prisma.user.deleteMany()

  const PASSWORD = await bcrypt.hash('password123', 10)

  const [demo, alice, bob] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'demo@example.com',
        name: 'Demo User',
        password: PASSWORD,
        avatarUrl: 'https://i.pravatar.cc/150?u=demo@example.com',
      },
    }),
    prisma.user.create({
      data: {
        email: 'alice@example.com',
        name: 'Alice Martin',
        password: PASSWORD,
        avatarUrl: 'https://i.pravatar.cc/150?u=alice@example.com',
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob@example.com',
        name: 'Bob Chen',
        password: PASSWORD,
        avatarUrl: 'https://i.pravatar.cc/150?u=bob@example.com',
      },
    }),
  ])

  const workspace = await prisma.workspace.create({
    data: {
      name: 'Acme Team',
      slug: 'acme-team',
      description: 'Demo workspace seeded for development.',
      locale: 'en',
      visibility: 'PRIVATE',
      defaultMemberRole: 'MEMBER',
      ownerId: demo.id,
      members: {
        create: [
          { userId: demo.id, role: 'OWNER' },
          { userId: alice.id, role: 'ADMIN' },
          { userId: bob.id, role: 'MEMBER' },
        ],
      },
      invites: {
        create: [{ email: 'carol@example.com', role: 'MEMBER', invitedById: demo.id }],
      },
    },
  })

  const board = await prisma.board.create({
    data: {
      title: 'Product Roadmap',
      ownerId: demo.id,
      workspaceId: workspace.id,
      members: {
        create: [
          { userId: demo.id, role: 'OWNER' },
          { userId: alice.id, role: 'ADMIN' },
          { userId: bob.id, role: 'MEMBER' },
        ],
      },
      labels: {
        create: [
          { name: 'Bug', color: '#ef4444' },
          { name: 'Feature', color: '#3b82f6' },
          { name: 'Urgent', color: '#f59e0b' },
        ],
      },
    },
    include: { labels: true },
  })

  const labelByName = Object.fromEntries(board.labels.map((l) => [l.name, l.id]))
  const day = 24 * 60 * 60 * 1000
  const startIn = (days: number) => new Date(Date.now() + days * day)
  const endIn = (days: number) => new Date(Date.now() + days * day)

  await prisma.list.create({
    data: {
      title: 'To Do',
      position: 0,
      boardId: board.id,
      cards: {
        create: [
          {
            title: 'Set up CI pipeline',
            description: 'GitHub Actions: lint, test, build on every PR.',
            position: 0,
            priority: 'MEDIUM',
            startDate: startIn(1),
            endDate: endIn(5),
            assignees: { connect: [{ id: bob.id }, { id: alice.id }] },
            labels: { connect: [{ id: labelByName['Feature'] }] },
          },
          {
            title: 'Design board UI',
            description: 'Trello-style columns with drag-and-drop.',
            position: 1,
            priority: 'LOW',
            startDate: startIn(3),
            assignees: { connect: [{ id: alice.id }] },
            labels: { connect: [{ id: labelByName['Feature'] }] },
          },
        ],
      },
    },
  })

  const inProgress = await prisma.list.create({
    data: {
      title: 'In Progress',
      position: 1,
      boardId: board.id,
      cards: {
        create: [
          {
            title: 'Implement authentication',
            description: 'JWT login/register with hashed passwords.',
            position: 0,
            priority: 'HIGH',
            startDate: startIn(-2),
            endDate: endIn(2),
            assignees: { connect: [{ id: demo.id }, { id: alice.id }] },
            labels: { connect: [{ id: labelByName['Urgent'] }, { id: labelByName['Feature'] }] },
          },
        ],
      },
    },
    include: { cards: true },
  })

  const done = await prisma.list.create({
    data: {
      title: 'Done',
      position: 2,
      boardId: board.id,
      cards: {
        create: [
          {
            title: 'Fix login redirect loop',
            description: 'Session cookie was not being cleared on logout.',
            position: 0,
            startDate: startIn(-7),
            endDate: endIn(-5),
            assignees: { connect: [{ id: alice.id }] },
            labels: { connect: [{ id: labelByName['Bug'] }] },
          },
        ],
      },
    },
    include: { cards: true },
  })

  const authCard = inProgress.cards[0]
  await prisma.comment.createMany({
    data: [
      { cardId: authCard.id, authorId: alice.id, body: 'Are we using JWT or sessions here?' },
      { cardId: authCard.id, authorId: demo.id, body: 'JWT — keeps the API stateless.' },
    ],
  })

  const fixCard = done.cards[0]

  await prisma.activity.createMany({
    data: [
      { boardId: board.id, userId: demo.id, action: 'created the board' },
      { boardId: board.id, userId: alice.id, action: 'joined the board' },
      { boardId: board.id, userId: bob.id, action: 'joined the board' },
      {
        boardId: board.id,
        cardId: fixCard.id,
        userId: alice.id,
        action: 'moved "Fix login redirect loop" to Done',
      },
      {
        boardId: board.id,
        cardId: authCard.id,
        userId: demo.id,
        action: 'added Alice to "Implement authentication"',
      },
    ],
  })

  console.log(
    `Seeded workspace "${workspace.name}" with board "${board.title}", 3 members, ` +
      `3 lists, 4 cards, 2 comments, 1 pending invite (owner: ${demo.email}).\n` +
      `Demo login: any seeded email + password "password123".`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

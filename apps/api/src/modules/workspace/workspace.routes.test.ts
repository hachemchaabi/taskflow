import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'

vi.mock('../../prisma/prisma.service.js', () => ({
  prisma: {
    workspaceMember: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
    workspace: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn() },
    workspaceInvite: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    notificationPreference: { findUnique: vi.fn() },
    notificationMute: { findFirst: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}))

vi.mock('./logoStorage.service.js', () => ({
  logoStorage: {
    upload: vi.fn().mockResolvedValue('https://dl.dropboxusercontent.com/s/x/logo.png?raw=1'),
    remove: vi.fn().mockResolvedValue(undefined),
  },
}))

import { app } from '../../app.module.js'
import { signAccessToken } from '../auth/auth.service.js'
import { prisma } from '../../prisma/prisma.service.js'

const auth = `Bearer ${signAccessToken('u1')}`

describe('workspace routes', () => {
  it('rejects unauthenticated GET /api/workspaces with 401', async () => {
    const res = await request(app).get('/api/workspaces')
    expect(res.status).toBe(401)
  })

  it('lists the current user’s workspaces', async () => {
    void (prisma.workspaceMember.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        role: 'OWNER',
        workspace: {
          id: 'w1',
          name: 'Acme',
          slug: 'acme',
          description: null,
          logoUrl: null,
          locale: 'en',
          visibility: 'PRIVATE',
          defaultMemberRole: 'MEMBER',
          _count: { members: 2, boards: 1 },
        },
      },
    ])
    const res = await request(app).get('/api/workspaces').set('Authorization', auth)
    expect(res.status).toBe(200)
    expect(res.body).toEqual([
      {
        id: 'w1',
        name: 'Acme',
        slug: 'acme',
        description: null,
        logoUrl: null,
        locale: 'en',
        visibility: 'PRIVATE',
        defaultMemberRole: 'MEMBER',
        role: 'OWNER',
        _count: { members: 2, boards: 1 },
      },
    ])
  })

  it('reports slug availability, normalising the input', async () => {
    void (prisma.workspace.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const res = await request(app)
      .get('/api/workspaces/slug-available?slug=My%20New%20Team')
      .set('Authorization', auth)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ slug: 'my-new-team', valid: true, available: true })
  })

  it('reports a slug as taken when another workspace owns it', async () => {
    void (prisma.workspace.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'other',
    })
    const res = await request(app)
      .get('/api/workspaces/slug-available?slug=acme')
      .set('Authorization', auth)
    expect(res.body).toEqual({ slug: 'acme', valid: true, available: false })
  })

  it('treats the excluded workspace’s own slug as available', async () => {
    void (prisma.workspace.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'w1' })
    const res = await request(app)
      .get('/api/workspaces/slug-available?slug=acme&excludeId=w1')
      .set('Authorization', auth)
    expect(res.body.available).toBe(true)
  })

  it('flags an empty/invalid slug as not valid', async () => {
    const res = await request(app)
      .get('/api/workspaces/slug-available?slug=%23%23')
      .set('Authorization', auth)
    expect(res.body).toEqual({ slug: '', valid: false, available: false })
  })

  it('updates settings fields and returns the full summary', async () => {
    void (prisma.workspaceMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      role: 'OWNER',
    })
    void (prisma.workspace.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    void (prisma.workspace.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'w1',
      name: 'Renamed',
      slug: 'renamed',
      description: 'Hi',
      logoUrl: null,
      locale: 'fr',
      visibility: 'PUBLIC',
      defaultMemberRole: 'ADMIN',
      _count: { members: 2, boards: 1 },
    })
    const res = await request(app)
      .patch('/api/workspaces/w1')
      .set('Authorization', auth)
      .send({ name: 'Renamed', slug: 'renamed', locale: 'fr', visibility: 'PUBLIC' })
    expect(res.status).toBe(200)
    expect(res.body.slug).toBe('renamed')
    expect(res.body.visibility).toBe('PUBLIC')
    expect(res.body.role).toBe('OWNER')
  })

  it('rejects an update whose slug is taken by another workspace', async () => {
    void (prisma.workspaceMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      role: 'ADMIN',
    })
    void (prisma.workspace.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'other',
    })
    const res = await request(app)
      .patch('/api/workspaces/w1')
      .set('Authorization', auth)
      .send({ slug: 'taken' })
    expect(res.status).toBe(409)
  })

  it('uploads a logo and returns the stored URL', async () => {
    void (prisma.workspaceMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      role: 'OWNER',
    })
    void (prisma.workspace.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'w1',
        name: 'Acme',
        slug: 'acme',
        description: null,
        logoUrl: data.logoUrl,
        locale: 'en',
        visibility: 'PRIVATE',
        defaultMemberRole: 'MEMBER',
        _count: { members: 1, boards: 0 },
      }),
    )
    const res = await request(app)
      .put('/api/workspaces/w1/logo')
      .set('Authorization', auth)
      .attach('logo', Buffer.from('fake-png-bytes'), {
        filename: 'logo.png',
        contentType: 'image/png',
      })
    expect(res.status).toBe(200)
    expect(res.body.logoUrl).toBe('https://dl.dropboxusercontent.com/s/x/logo.png?raw=1')
  })

  it('rejects a non-image logo with 415', async () => {
    void (prisma.workspaceMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      role: 'OWNER',
    })
    const res = await request(app)
      .put('/api/workspaces/w1/logo')
      .set('Authorization', auth)
      .attach('logo', Buffer.from('not an image'), { filename: 'x.txt', contentType: 'text/plain' })
    expect(res.status).toBe(415)
  })

  it('rejects an oversized logo with 413', async () => {
    void (prisma.workspaceMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      role: 'OWNER',
    })
    const tooBig = Buffer.alloc(2 * 1024 * 1024 + 1, 1)
    const res = await request(app)
      .put('/api/workspaces/w1/logo')
      .set('Authorization', auth)
      .attach('logo', tooBig, { filename: 'big.png', contentType: 'image/png' })
    expect(res.status).toBe(413)
  })

  it('transfers ownership to another member and demotes the caller', async () => {
    void (prisma.workspaceMember.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ role: 'OWNER' })
      .mockResolvedValueOnce({ role: 'MEMBER' })
    void (prisma.workspace.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'w1',
      name: 'Acme',
      slug: 'acme',
      description: null,
      logoUrl: null,
      locale: 'en',
      visibility: 'PRIVATE',
      defaultMemberRole: 'MEMBER',
      _count: { members: 2, boards: 0 },
      members: [
        { id: 'm2', userId: 'u2', role: 'OWNER', user: { id: 'u2' } },
        { id: 'm1', userId: 'u1', role: 'ADMIN', user: { id: 'u1' } },
      ],
    })
    const res = await request(app)
      .post('/api/workspaces/w1/transfer-ownership')
      .set('Authorization', auth)
      .send({ userId: 'u2' })
    expect(res.status).toBe(200)
    expect(res.body.role).toBe('ADMIN')
    expect(res.body.members.find((m: { userId: string }) => m.userId === 'u2').role).toBe('OWNER')
  })

  it('rejects transferring ownership to a non-member with 404', async () => {
    void (prisma.workspaceMember.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ role: 'OWNER' })
      .mockResolvedValueOnce(null)
    const res = await request(app)
      .post('/api/workspaces/w1/transfer-ownership')
      .set('Authorization', auth)
      .send({ userId: 'ghost' })
    expect(res.status).toBe(404)
  })

  it('rejects transferring ownership to yourself with 400', async () => {
    void (prisma.workspaceMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      role: 'OWNER',
    })
    const res = await request(app)
      .post('/api/workspaces/w1/transfer-ownership')
      .set('Authorization', auth)
      .send({ userId: 'u1' })
    expect(res.status).toBe(400)
  })

  it('rejects ownership transfer by a non-owner with 403', async () => {
    void (prisma.workspaceMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      role: 'ADMIN',
    })
    const res = await request(app)
      .post('/api/workspaces/w1/transfer-ownership')
      .set('Authorization', auth)
      .send({ userId: 'u2' })
    expect(res.status).toBe(403)
  })

  it('clears the logo on delete', async () => {
    void (prisma.workspaceMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      role: 'ADMIN',
    })
    void (prisma.workspace.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'w1',
      name: 'Acme',
      slug: 'acme',
      description: null,
      logoUrl: null,
      locale: 'en',
      visibility: 'PRIVATE',
      defaultMemberRole: 'MEMBER',
      _count: { members: 1, boards: 0 },
    })
    const res = await request(app).delete('/api/workspaces/w1/logo').set('Authorization', auth)
    expect(res.status).toBe(200)
    expect(res.body.logoUrl).toBeNull()
  })

  it('returns 403 on detail when the user is not a member', async () => {
    void (prisma.workspaceMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const res = await request(app).get('/api/workspaces/w9').set('Authorization', auth)
    expect(res.status).toBe(403)
  })

  it('falls back to the workspace default role when an invite omits one', async () => {
    void (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'u2' })
    void (prisma.workspaceMember.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      role: 'OWNER',
    })
    void (prisma.workspace.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      defaultMemberRole: 'ADMIN',
    })
    void (prisma.workspaceMember.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    void (prisma.workspaceInvite.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    void (prisma.workspaceInvite.upsert as ReturnType<typeof vi.fn>).mockImplementation(
      ({ create }) =>
        Promise.resolve({
          id: 'i1',
          email: create.email,
          role: create.role,
          status: 'PENDING',
          createdAt: new Date('2026-01-01'),
          workspace: { id: 'w1', name: 'Acme' },
          invitedBy: { id: 'u1', name: 'Me' },
        }),
    )
    const res = await request(app)
      .post('/api/workspaces/w1/invites')
      .set('Authorization', auth)
      .send({ email: 'new@example.com' })
    expect(res.status).toBe(201)
    expect(res.body.role).toBe('ADMIN')
  })

  it('lists my pending invites', async () => {
    void (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'u1',
      email: 'me@example.com',
    })
    void (prisma.workspaceInvite.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])
    const res = await request(app).get('/api/invites').set('Authorization', auth)
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })
})

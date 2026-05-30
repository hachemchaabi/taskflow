# Technical Documentation — TaskFlow

## Architecture overview

A monorepo with two npm workspaces:

- **`apps/web`** — a React 18 SPA built with Vite. Client-side routing (React Router v6), global
  state via Context + `useReducer`, data access through a thin Axios layer, and a Socket.IO client
  for real-time updates.
- **`apps/api`** — an Express server written in TypeScript, talking to PostgreSQL through Prisma,
  with a Socket.IO server attached to the same HTTP server for presence and live updates.

In development the Vite dev server proxies `/api/*` to Express (`http://localhost:4000`), so the
frontend uses same-origin relative URLs and there are no CORS surprises locally.

```
Browser ──▶ Vite dev server (:5173) ──/api proxy──▶ Express (:4000) ──Prisma──▶ PostgreSQL
        ◀────────────── Socket.IO (presence, typing, live updates, notifications) ──────────────▶
```

The frontend is organised **by feature module** (`modules/<feature>/{components,data,features,
hooks,routes}`) with cross-cutting code in `shared/`. The backend mirrors this: each feature owns a
`controller`, `routes`, and `service`, with shared middleware in `common/` and Prisma access via a
client singleton.

## Data models

Defined in `apps/api/prisma/schema.prisma`:

- **User** — account (email, hashed password, name, avatar). Owns boards & workspaces, is assigned
  to cards, authors comments, receives notifications.
- **Workspace** — the top-level team container (name, unique slug, logo, visibility, locale,
  default member role). Holds boards, members, and invites.
- **WorkspaceMember** — join table giving a user a role (`OWNER` / `ADMIN` / `MEMBER`) on a
  workspace.
- **WorkspaceInvite** — an email invitation with a status (`PENDING` / `ACCEPTED` / `DECLINED`).
- **Board** — a Kanban project inside a workspace (title, icon).
- **BoardMember** — join table giving a user a role on a board.
- **List** — an ordered column within a board (integer `position` for ordering).
- **Card** — a task within a list (`position`, `priority`, optional start/end dates). Many-to-many
  with assignees (users) and labels.
- **Label** — a colored tag belonging to a board, attachable to many cards.
- **Comment** — a message on a card; supports one level of replies (`parentId`), `@mentions`, edit
  (`editedAt`), and soft delete (`deletedAt`).
- **CommentMention** — join table recording which users a comment mentions (restricted to board
  members).
- **Activity** — an audit/feed entry for a board (action, actor, optional card).
- **Notification** — a per-user notification (`type`, actor, related workspace/board/card, JSON
  data snapshot, `readAt`).
- **NotificationPreference** — per-user toggles for each notification type plus a do-not-disturb
  window (`dndUntil`).
- **NotificationMute** — a per-user mute of a specific workspace or board.

**Enums:** `MemberRole` (OWNER/ADMIN/MEMBER), `Visibility` (PUBLIC/PRIVATE/INVITE_ONLY),
`InviteStatus` (PENDING/ACCEPTED/DECLINED), `Priority` (HIGH/MEDIUM/LOW/NONE), `NotificationType`
(CARD_ASSIGNED/MENTION/COMMENT_ON_ASSIGNED/WORKSPACE_INVITE/CARD_MOVED/STATUS_CHANGED).

Ordering of lists and cards uses integer `position` columns; reordering updates positions.

## State management design

Global state is split into feature-owned contexts, each backed by a `useReducer` slice and consumed
through a hook (never the raw context):

- **AuthContext** (`modules/auth/data`) — `{ user, token, status, error }`; exposes `login`,
  `register`, `logout`, `updateProfile`, avatar upload/remove. On app load it calls the refresh
  endpoint to rehydrate the session; the access token is persisted to `localStorage` (`ctm.token`).
- **WorkspaceContext** (`modules/workspace/data`) — the user's workspaces and the current one, plus
  member and invite operations.
- **NotificationContext** (`modules/notification/data`) — the notification list and read/clear
  operations; subscribes to the `notification:new` socket event and raises a toast.
- **RealtimeContext** (`shared/realtime`) — per-board presence and per-card typing indicators
  derived from socket events.

**Local state** is used inside pages/forms where it doesn't need to be shared. **Server data** is
fetched per-view through `useFetch`, which owns loading/error state and cancels in-flight requests
with `AbortController` on unmount or dependency change.

## API layer & error handling

- `apps/web/src/shared/services/client.ts` configures one Axios instance. A **request
  interceptor** attaches `Authorization: Bearer <token>`; a **response interceptor** catches `401`,
  calls `POST /api/auth/refresh`, and transparently retries the original request (silent refresh).
- On the server, an `asyncHandler` forwards rejected promises to a central error handler that maps
  `ZodError` → 400, known `HttpError` → its status, and anything else → 500. Unmatched routes
  return 404.

### API endpoints (overview)

- **Auth** — `POST /api/auth/{register,login,refresh,logout}`, `GET/PATCH /api/auth/me`,
  `PUT/DELETE /api/auth/me/avatar`.
- **Workspaces** — `GET/POST /api/workspaces`, `GET/PATCH/DELETE /api/workspaces/:id`,
  activity, logo, transfer-ownership, member management, and `…/invites` CRUD.
- **Invites** — `GET /api/invites`, `POST /api/invites/:id/{accept,decline}`.
- **Boards** — `GET/POST /api/boards`, `GET/PATCH/DELETE /api/boards/:id`, board icon, member
  management, and `POST /api/boards/:boardId/{cards,labels}`.
- **Cards** — `GET/PATCH/DELETE /api/cards/:id`, comments CRUD under `/api/cards/:id/comments`.
- **Notifications** — list, unread-count, read/read-all, clear, preferences, and mutes.
- **Health** — `GET /api/health`.

## Routing

Routes are assembled in `shared/routes` from per-module route files and rendered in `App.tsx`. All
routes are lazy-loaded with `React.lazy` + `Suspense` for code splitting. `GuestGuard` wraps
`/login` and `/signup` (redirecting authenticated users away); `AuthGuard` wraps the rest and
preserves the intended destination on redirect to `/login`. A catch-all `*` route renders the 404
page. Settings live under nested `/settings/*` routes (profile, workspace, members, notifications).

## Authentication & security

- **JWT** — short-lived access token (15m default) signed with `JWT_SECRET`; refresh token (7d
  default) signed with `JWT_REFRESH_SECRET` and stored in an **httpOnly cookie** scoped to
  `/api/auth`. Cookie flags adapt to environment (`secure` + `sameSite=none` in production).
- **Passwords** — hashed with bcrypt (10 rounds). Login does a timing-safe comparison against a
  dummy hash on user-not-found to avoid user enumeration.
- **Authorization** — role checks (Owner/Admin/Member) gate workspace and board operations on the
  server; the client mirrors these for UX only.

## Real-time layer

A Socket.IO server (`apps/api/src/realtime`) shares the Express HTTP server. A handshake middleware
verifies the JWT before a socket is accepted. Clients `join`/`leave` board and workspace rooms and
publish their viewing context; the server keeps an in-memory **presence registry** and broadcasts:

- `presence:state` — who is on a board and what they're viewing/editing.
- `typing:state` — who is typing on a given card (auto-expires after 3s).
- `board:changed` / `card:changed` / `boards:changed` — live data updates.
- `workspace:added` / `workspace:removed` — membership changes.
- `notification:new` — delivered to the recipient's user room.

## Key design decisions

- **Vite over CRA** — faster dev server, first-class TS/ESM, smaller production builds.
- **Feature-module architecture** — each feature owns its components, state, routes, and API,
  keeping the codebase navigable as it grew well past a single-folder layout.
- **Context + `useReducer` per concern** — clear separation (session, workspace, notifications,
  realtime) with no prop drilling, instead of a single global store.
- **Prisma + PostgreSQL** — type-safe queries and migrations; the schema is the single source of
  truth.
- **Zod on the server** — runtime validation of request bodies, decoupled from Prisma types.
- **Socket.IO** — rooms map cleanly onto boards/workspaces, and the JWT handshake reuses the same
  auth as the REST API.

## Performance optimizations

- Route-level code splitting via `React.lazy` + `Suspense`.
- `useMemo` / `useCallback` to keep board and list renders stable under frequent realtime updates.
- Request cancellation through `AbortController` in `useFetch` (no setState-after-unmount leaks);
  socket listeners are cleaned up in `useEffect` teardown.
- Single shared Axios instance; a Prisma client singleton to avoid pool exhaustion on hot reload.

## Known limitations / next steps

- Presence is held in memory on the API process, so it does not survive horizontal scaling without
  a shared adapter (e.g. the Socket.IO Redis adapter).
- Avatar/logo uploads are stored via the configured provider; the Dropbox integration hooks are
  stubbed and unused by default.
- The production Vite bundle ships a large main chunk; further `manualChunks` splitting would
  improve first-load on slow connections.
- Coverage is concentrated on business logic (modules, reducers, hooks, API routes); many
  presentational `shared/ui` primitives are intentionally untested, which lowers the aggregate
  line-coverage figure.

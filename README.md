# TaskFlow — Collaborative Task Manager

> Capstone project (Lab 6, **Option B: Collaborative Task Manager**) — a Trello-like team board
> with real-time collaboration, built as a full-stack TypeScript application.

TaskFlow is a team task-management app. Teams organise work into **workspaces**, each holding
**boards**; every board is a Kanban surface where cards move across lists (To Do → In Progress →
Done) via drag-and-drop. Members are assigned to cards, mention each other in threaded comments,
label and prioritise tasks, and watch everything update **live** as teammates work — presence
indicators, typing indicators, card movements, and in-app notifications all stream over WebSockets.

It is a full-stack app: a **React 18 + TypeScript** single-page frontend and an **Express +
Prisma + PostgreSQL** API, with **JWT authentication** (access + refresh tokens) and
**Socket.IO** powering the real-time layer.

---

## Problem solved & target users

**Problem.** Small teams lose track of who is doing what. Work is scattered across chats and
spreadsheets, there's no shared source of truth for status, and people step on each other's
changes because they can't see what teammates are doing in the moment.

**Target users.** Small-to-mid product, engineering, and operations teams who want a lightweight,
self-hostable board to plan and track work together in real time — without the weight of a large
project-management suite.

**TaskFlow addresses this with:** a single shared board per project, live status columns, clear
task ownership and priority, threaded discussion with @mentions on each task, and instant,
collaborative updates so the board always reflects reality.

---

## Key features

- **Authentication** — email/password sign-up & login, JWT access tokens with silent refresh,
  protected and guest-only routes, persisted sessions.
- **Workspaces** — create workspaces, invite members by email, accept/decline invitations,
  role-based access (Owner / Admin / Member), transfer ownership, workspace settings (name, slug,
  logo, visibility, locale).
- **Boards & Kanban** — multiple boards per workspace, lists and cards, **drag-and-drop**
  reordering of cards and lists (powered by `@dnd-kit`), per-board members and labels, board icons.
- **Tasks (cards)** — a detail sheet to edit title/description, assign teammates, set priority and
  start/end dates, and attach colored labels.
- **Comments** — threaded comments (one level of replies) with **@mentions** and autocomplete,
  edit and soft-delete.
- **Real-time collaboration** — live presence (who's viewing which board/card), typing indicators,
  and instant board/card updates across connected clients via Socket.IO.
- **Notifications** — six notification types (assigned, mention, comment on assigned task, invite,
  card moved, status changed), an Inbox with notifications + invitations, per-type preferences, a
  do-not-disturb window, and per-board/workspace mutes.
- **Dashboard** — a personal "My Tasks" table plus a workspace activity feed.
- **Theming** — light/dark mode, persisted to `localStorage`.
- **Responsive** — works across mobile (320px), tablet (768px), and desktop (1024px+).

---

## Tech stack

| Layer        | Choice                                                              |
| ------------ | ------------------------------------------------------------------- |
| Frontend     | React 18, TypeScript (strict), Vite 6                               |
| Routing      | React Router v6 — lazy-loaded routes, auth/guest guards, 404 route  |
| State        | Context API + `useReducer` (auth, workspace, notifications, realtime)|
| Styling      | Tailwind CSS v4 + design tokens, CVA variants, Base UI primitives   |
| HTTP         | Axios with request/response interceptors (token inject + refresh)   |
| Real-time    | Socket.IO (client + server)                                         |
| Backend      | Node.js, Express 4, TypeScript                                      |
| Database     | PostgreSQL via Prisma 6 ORM                                         |
| Auth         | JWT (access + refresh), bcrypt password hashing, httpOnly cookies   |
| Validation   | Zod (server-side request validation)                                |
| Testing      | Vitest + React Testing Library (web), Vitest + supertest (api)      |
| Quality      | ESLint + Prettier, `tsc --noEmit` on build                          |
| Deployment   | Vercel (web), Render (API + PostgreSQL), Docker                     |

---

## Repository layout

An **npm-workspaces monorepo** with two apps:

```
.
├── apps/
│   ├── web/                      # React + Vite frontend  (@ctm/web)
│   │   ├── vercel.json           # SPA rewrite config for Vercel
│   │   └── src/
│   │       ├── modules/          # feature modules
│   │       │   ├── auth/         #   login, signup, JWT, profile
│   │       │   ├── board/        #   Kanban board, cards, comments, task sheet
│   │       │   ├── dashboard/    #   my-tasks table + activity feed
│   │       │   ├── notification/ #   inbox, preferences, mutes
│   │       │   ├── workspace/    #   workspaces, members, invitations, settings
│   │       │   └── theme/        #   light/dark theme
│   │       ├── shared/
│   │       │   ├── ui/           #   design-system primitives (Base UI + CVA)
│   │       │   ├── components/   #   composed shared components (layout, sidebar, …)
│   │       │   ├── guards/       #   AuthGuard, GuestGuard
│   │       │   ├── routes/       #   root router assembly
│   │       │   ├── realtime/     #   Socket.IO client + presence context
│   │       │   ├── services/     #   Axios client + interceptors
│   │       │   └── utils/        #   validators, localStorage helpers
│   │       └── lib/              #   cn() helper, semantic Icons map
│   │
│   └── api/                      # Express + Prisma backend  (@ctm/api)
│       ├── Dockerfile            # container build for the API
│       ├── prisma/               # schema.prisma + seed.ts
│       └── src/
│           ├── modules/          # auth, board, card, workspace, notification
│           │   └── <feature>/    #   <feature>.{controller,routes,service}.ts (+ *.test.ts)
│           ├── realtime/         # Socket.IO gateway + presence registry
│           ├── common/           # auth middleware, error handler
│           └── config/           # env loading
│
├── docker-compose.yml            # local Postgres + API
├── render.yaml                   # Render blueprint (API + PostgreSQL)
└── package.json                  # workspace root scripts
```

---

## Prerequisites

- **Node.js 22+** (the API Docker image uses `node:22-alpine`)
- **PostgreSQL** — either a local instance, or use the bundled Docker Compose service

---

## Getting started (local)

```bash
# 1. Clone and install all workspace dependencies (from the repo root)
git clone https://github.com/hachemchaabi/taskflow.git
cd taskflow
npm install

# 2. Start a local PostgreSQL (Docker), or point DATABASE_URL at your own instance
docker compose up -d db          # starts Postgres on localhost:5433

# 3. Configure the API environment
cp apps/api/.env.example apps/api/.env
#    the default DATABASE_URL already matches the Docker Compose service above

# 4. Configure the web environment
cp apps/web/.env.example apps/web/.env

# 5. Generate the Prisma client, create the schema, and seed demo data
npm run db:generate
npm run db:migrate               # runs `prisma migrate dev`
npm run db:seed                  # inserts demo users, a workspace, and a sample board

# 6. Start both servers (API on :4000, web on :5173)
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api/*` to the Express server.

### Demo credentials

The seed creates a ready-to-use team. Log in with:

| Email               | Password      | Role in "Acme Team" |
| ------------------- | ------------- | ------------------- |
| `demo@example.com`  | `password123` | Owner               |
| `alice@example.com` | `password123` | Admin               |
| `bob@example.com`   | `password123` | Member              |

---

## Running tests

```bash
npm test                      # web test suite (Vitest) — runs from the root
npm run test:coverage -w @ctm/web    # web coverage report
npm run test -w @ctm/api      # API test suite (needs JWT_*/DATABASE_URL env vars)
```

The web suite has 196 tests and the API suite 130, across reducers, hooks, components, and routes.

---

## Useful commands

| Command              | What it does                                   |
| -------------------- | ---------------------------------------------- |
| `npm run dev`        | Run API + web concurrently                     |
| `npm run dev:web`    | Run only the frontend                          |
| `npm run dev:api`    | Run only the backend                           |
| `npm run build`      | Type-check and build both workspaces           |
| `npm run lint`       | Lint both workspaces                           |
| `npm run format`     | Format with Prettier                           |
| `npm test`           | Run frontend tests (Vitest)                    |
| `npm run db:generate`| Generate the Prisma client                     |
| `npm run db:migrate` | Apply Prisma migrations                        |
| `npm run db:seed`    | Seed demo data                                 |
| `npm run db:studio`  | Open Prisma Studio                             |

---

## Deployment

The web app deploys to **Vercel** (static Vite build; `apps/web/vercel.json` handles SPA routing)
and the API + database to **Render** (Dockerized service + managed PostgreSQL, defined in
`render.yaml`). Deploy the API first, then the web app, then connect them.

- **Web (Vercel):** _add your live URL here after deploying_
- **API (Render):** _add your API URL here after deploying_

> After deploying, set `VITE_API_BASE_URL` and `VITE_SOCKET_URL` (web) to the Render API URL, and
> set `CLIENT_ORIGIN` (API) to the Vercel URL so CORS, cookies, and the WebSocket handshake line up.

---

## How it maps to the capstone requirements

| Requirement (Lab 6)          | Where it's met                                                            |
| ---------------------------- | ------------------------------------------------------------------------- |
| Routing (4–5 routes, nested, protected, 404) | React Router v6: 10 routes, `AuthGuard`/`GuestGuard`, nested `/settings/*`, catch-all 404 |
| State (Context + useReducer, localStorage) | Auth, Workspace, Notification, Realtime contexts; token + theme persisted |
| API integration (errors, loading, cancellation) | Axios interceptors, silent token refresh, `useFetch` with `AbortController` |
| Data management (validation, error messages) | Zod on the server; client-side validators; user-facing error toasts        |
| Testing (unit, reducer, hook, component) | Vitest + RTL (web) and supertest (api) — 326 tests across both workspaces        |
| Performance (lazy loading, memoization)        | Route-level `React.lazy` + `Suspense`, `useMemo`/`useCallback`, effect cleanup |
| Accessibility                                  | Semantic HTML, Base UI primitives (ARIA + keyboard), labelled forms        |
| Code quality                                   | ESLint + Prettier, strict TypeScript, feature-module structure              |
| Deployment                                     | Vercel (web) + Render (API + Postgres), HTTPS, responsive                  |

See [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) for architecture, data models, and
design decisions.

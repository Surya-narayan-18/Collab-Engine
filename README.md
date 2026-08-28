# CollabEngine

An AI-powered real-time collaboration platform built as a full-stack portfolio project. Features workspace management, channel-based messaging, live presence tracking, and typing indicators.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL 16, Prisma 7 (ORM) |
| Real-time | Socket.IO |
| Cache/Presence | Redis 7, ioredis |
| DevOps | Docker, Docker Compose |

## Features (V1.0)

- **Authentication**: JWT-based register/login with bcrypt password hashing
- **Workspaces**: Create, list, and manage workspaces with role-based access (OWNER/ADMIN/MEMBER)
- **Member Management**: Add/remove members by email (OWNER/ADMIN only)
- **Channels**: Create, list, join, and delete channels within workspaces
- **Messages**: Send and receive messages with cursor-based pagination (compound cursor for collision safety)
- **Real-time**: Socket.IO for live message delivery, typing indicators, and online presence
- **Rate Limiting**: 100 req/min general, 10 req/min on auth routes
- **Authorization**: Layered middleware — workspace membership, channel membership, and role checks

## Prerequisites

- Node.js ≥ 22
- Docker & Docker Compose
- Git

## Quick Start (Development)

### 1. Clone and install

```bash
git clone <repo-url>
cd Collab-Engine

# Install server deps
cd server
npm install
cp .env.example .env   # then edit .env with your values
cd ..

# Install client deps
cd client
npm install
cd ..
```

### 2. Start infrastructure (PostgreSQL + Redis)

```bash
docker compose up -d
```

### 3. Run database migrations

```bash
cd server
npx prisma migrate dev
```

### 4. Start the dev servers

```bash
# Terminal 1 — Server (port 5000)
cd server
npm run dev

# Terminal 2 — Client (port 5173)
cd client
npm run dev
```

### 5. Open the app

Navigate to `http://localhost:5173` — register an account and start collaborating!

## Production Deployment

```bash
# Build and run all services
docker compose --profile production up --build -d

# Run migrations against the containerized DB
docker exec collabengine-server npx prisma migrate deploy
```

The app will be available at `http://localhost` (port 80).

## Project Structure

```
Collab Engine/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # React Context providers (Auth, Workspace, Socket)
│   │   ├── lib/               # API client helper
│   │   └── pages/             # Route-level page components
│   ├── Dockerfile
│   └── nginx.conf
├── server/                    # Express backend
│   ├── src/
│   │   ├── config/            # Zod-validated env config
│   │   ├── controllers/       # Route handlers
│   │   ├── errors/            # AppError class
│   │   ├── lib/               # Prisma + Redis singletons, safeUser
│   │   ├── middleware/        # Auth, authorization, validation, rate limiting, error handling
│   │   ├── routes/            # Express routers (nested)
│   │   ├── services/          # Business logic
│   │   ├── socket/            # Socket.IO server setup
│   │   └── validators/        # Zod schemas
│   ├── prisma/                # Schema + migrations
│   └── Dockerfile
├── docker-compose.yml         # Dev + production profiles
└── PROGRESS.md                # Detailed build log
```

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register a new account |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | JWT | Get current user |

### Workspaces
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/workspaces` | JWT | Create workspace |
| GET | `/api/workspaces` | JWT | List user's workspaces |
| GET | `/api/workspaces/:id` | JWT + Member | Get workspace details |
| POST | `/api/workspaces/:id/members` | JWT + OWNER/ADMIN | Add member by email |
| DELETE | `/api/workspaces/:id/members/:userId` | JWT + OWNER/ADMIN | Remove member |
| DELETE | `/api/workspaces/:id` | JWT + OWNER | Delete workspace |

### Channels
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/workspaces/:wsId/channels` | JWT + WS Member | Create channel |
| GET | `/api/workspaces/:wsId/channels` | JWT + WS Member | List channels |
| GET | `/api/workspaces/:wsId/channels/:chId` | JWT + WS Member | Get channel details |
| POST | `.../:chId/join` | JWT + WS Member | Join a channel |
| DELETE | `.../:chId` | JWT + WS OWNER | Delete channel |

### Messages
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `.../:chId/messages` | JWT + CH Member | Send message |
| GET | `.../:chId/messages?cursor=&limit=` | JWT + CH Member | Get message history |

### Socket.IO Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `join:workspace` | Client → Server | Join workspace room |
| `join:channel` | Client → Server | Join channel room |
| `leave:channel` | Client → Server | Leave channel room |
| `message:send` | Client → Server | Send message (persisted + broadcast) |
| `message:new` | Server → Client | New message received |
| `typing:start` / `typing:stop` | Client → Server | Typing indicators |
| `typing:update` | Server → Client | Typing state changed |
| `presence:update` | Server → Client | Online users updated |

## Environment Variables

See `server/.env.example` for all required variables.

## License

MIT

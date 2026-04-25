# StudyOrbit Workspace

## Overview

StudyOrbit is a Galaxy-Based Intelligent Study & Skill Matching Platform. Users are "satellites" orbiting subject "planets" in an animated galaxy dashboard. The app matches students based on subject, skill level, study time, goal type, and skill categories using a weighted scoring algorithm.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + TailwindCSS + Framer Motion
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Architecture

### Frontend (`artifacts/study-orbit`)
- Galaxy Dashboard (`/`) — Animated orbiting satellites, starfield, matching animation
- Profile (`/profile`) — User profile setup/edit
- Teams (`/teams`) — Browse and join teams
- Create Team (`/create-team`) — Create teams with role requirements
- Matches (`/matches`) — Top matches with compatibility breakdown

### Backend (`artifacts/api-server`)
Routes:
- `GET/POST /api/users` — List and create users
- `GET/PATCH /api/users/:id` — Get and update user
- `GET /api/users/:id/matches` — Get top matches (weighted algorithm)
- `GET/POST /api/teams` — List and create teams
- `GET /api/teams/:id` — Get team with members and roles
- `GET /api/teams/:id/candidates` — Top candidates for team
- `POST /api/teams/:id/members` — Add member to team
- `GET /api/dashboard/stats` — Galaxy stats (totals, breakdowns)

### Matching Algorithm
Weighted scoring (total 100 points):
- Subject Match: 30 points
- Skill Category Match: 25 points (Jaccard similarity)
- Study Time Match: 20 points (flexible gets partial credit)
- Skill Level Match: 15 points
- Goal Type Match: 10 points

### Database Tables (`lib/db`)
- `users` — User profiles
- `teams` — Study teams
- `role_requirements` — Required roles per team
- `team_members` — Team membership

## UI Design
- Deep space dark theme (near-black #050810)
- Neon cyan (#00d4ff) primary accent
- Glassmorphism panels with backdrop-blur
- Animated CSS starfield background
- SVG orbit rings with Framer Motion animation
- Space-themed terminology: "Callsign" = name, "Active Cycle" = study time, "Mission Objective" = goal type

## Notes
- New users are redirected to `/profile` to set up their "pilot registration"
- Current user ID is stored in `localStorage` as `studyorbit_user_id`
- 15 seeded users + 3 seeded teams for demo purposes
- The `lib/api-zod/src/index.ts` only exports from `./generated/api` (not types folder) to avoid duplicate exports

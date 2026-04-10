# SprintFlow — Claude Code Context

## Project
SprintFlow is a Jira-like project management tool built as a portfolio project.
It is NOT a clone — it is an original product with clean architecture.

## Stack
- Frontend: React 18 + Vite + TypeScript + TailwindCSS + React Query v5 + Zustand
- Backend: Node.js 20 + Express 4 + TypeScript + Mongoose 8
- Database: MongoDB Atlas (db name: sprintflow)
- Auth: JWT — access token stored in memory (Zustand), refresh token in httpOnly cookie

## Repo Structure
- client/   → React app → deployed to Vercel
- server/   → Express API → deployed to Render

## TypeScript Conventions
- Strict mode enabled in tsconfig for both client and server
- No use of `any` type — use `unknown` and narrow it
- All function parameters and return types explicitly typed
- Interfaces for all data shapes (IUser, IIssue, IProject)
- Separate types/ folder in both client and server
- API response types shared via types/ folder
- Use type for unions/intersections, interface for object shapes

## API Conventions
- All routes prefixed: /api/v1/
- Pattern: routes → controllers → services → models
- Always use async/await, never callbacks or .then()
- Always use correct HTTP status codes:
  200 OK, 201 Created, 204 No Content, 400 Bad Request,
  401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Server Error
- All responses follow this shape:
  { success: boolean, data: {} | [], message: string }
- Validation: express-validator on all POST/PATCH routes
- Errors: always throw to centralized error handler middleware

## Naming Conventions
- TS files: camelCase → issueController.ts, authService.ts
- Model files: PascalCase → Issue.ts, User.ts
- Interface names: PascalCase with I prefix → IUser, IIssue
- Type names: PascalCase with T prefix → TApiResponse, TJwtPayload
- URL slugs: kebab-case → /api/v1/project-members
- Env vars: SCREAMING_SNAKE_CASE → MONGO_URI, JWT_SECRET
- React components: PascalCase → IssueCard.tsx, KanbanBoard.tsx
- React hooks: camelCase with use prefix → useIssues.ts, useAuth.ts

## Code Style
- No console.log in production code — use a logger
- No hardcoded strings — use constants files
- Destructure props and objects
- Early returns over nested if/else
- Meaningful variable names — no single letters except loop indices
- All React component props typed with interface

## Database
- DB name: sprintflow
- Collections: users, projects, issues, comments, sprints
- Always add createdAt/updatedAt via Mongoose timestamps: true
- Use _id references between collections (not embedded docs for issues)
- Mongoose Document interfaces extend Document from mongoose

## Security
- Never commit .env files
- Sanitize all user inputs
- Rate limit all auth routes
- CORS restricted to CLIENT_URL env var in production

## User Journey
1. Register/Login
2. If no org → redirect to /onboarding → create org → become owner
3. If has org → redirect to /org/:orgSlug/projects
4. If multiple orgs → redirect to /select-org

## Organisation Rules
- User can belong to multiple orgs
- Each org has a unique slug (auto-generated from name)
- Roles: owner (1 per org) | admin | member
- Invite flow: generate token → share link → recipient joins
- Only owner/admin can invite members
- Only owner can delete org or transfer ownership

## URL Structure
All app routes are scoped to org:
/onboarding
/select-org  
/org/:orgSlug/projects
/org/:orgSlug/projects/:projectId/board
/org/:orgSlug/projects/:projectId/backlog
/org/:orgSlug/members
/org/:orgSlug/settings
/invite/:token  (public)
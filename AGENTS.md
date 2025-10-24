# Repository Guidelines

## Project Structure & Module Organization
`frontend/` hosts the Next.js 15 app with UI parts in `components/`, shared helpers in `lib/`, and static assets in `public/`. `backend/` provides the Express + Drizzle API, grouping features inside `src/modules/`, endpoints in `src/routes/`, and cross-cutting helpers in `src/shared/`. Roadmap specs live in `specs/`, operational docs in `doc/`, and `docker-compose.yml` orchestrates the stack.

## Build, Test, and Development Commands
- `npm run dev` (repo root): installs frontend deps as needed and starts the Next.js dev server on port 4000.
- `cd frontend && npm run build`: produces the prerendered frontend in `out/` (wrangler-compatible).
- `cd backend && npm run dev`: starts the API with `tsx watch`, reloading on TypeScript changes.
- `cd backend && npm run db:migrate|db:seed`: applies Drizzle migrations and loads baseline data.
- `docker-compose up -d`: boots the full stack (frontend + backend + PostgreSQL) for parity testing.

## Coding Style & Naming Conventions
TypeScript is mandatory across both apps; favor strict typings when you touch tsconfig. The backend bundles ESLint + Prettier 3—run `npm run lint` there and `npx prettier --check .` in the directory you edit. Prefer PascalCase for React components, camelCase for symbols, and kebab-case for file names representing routes or scripts. Keep feature-specific styles, mocks, and services inside the same module to simplify imports.

## Testing Guidelines
Use Vitest for frontend coverage (`cd frontend && npx vitest run` or `npx vitest --ui`). Backend validation currently leans on types and smoke runs; place new tests beside the module under `src/` with a `.test.ts` suffix. Run `npm run type-check` in both apps before opening a PR and list any manual verification (API calls, crawler runs) in the PR description.

## Commit & Pull Request Guidelines
Follow Conventional Commit prefixes already in history (`feat`, `fix`, `docs`, `chore`, etc.) and keep messages concise, English-first. Each PR must state the problem, outline the solution, list verification steps, and link to matching specs or issues. Rebase before merging, request a reviewer for backend-impacting work, and confirm docker-compose and key npm scripts succeed locally.

## Environment & Configuration Tips
Copy `frontend/.env.example` for local setup, keep production secrets in `.env.production`, and never commit real credentials. The backend expects PostgreSQL and crawler keys in `backend/.env`; regenerate migrations via `npm run db:generate` after schema edits and include the diff. Cloudflare Pages reads from `frontend/out/`, so confirm `npm run build` before running `npm run deploy`.

# AI Agent Instructions

## Project Overview
This is a personal diary monorepo built with Turborepo + pnpm workspace.

## Tech Stack
- Framework: Next.js 15 (App Router)
- Language: TypeScript 5.9 (strict mode)
- Styling: Tailwind CSS v4 + shadcn-style UI components
- Backend Logic: Server Actions
- Data Layer: Prisma + Supabase
- AI: Vercel AI SDK
- Code Quality: Biome

## Monorepo Structure
- apps/web: Main diary app (Next.js)
- apps/docs: Documentation app (Next.js)
- packages/ui: Shared UI components
- packages/typescript-config: Shared TypeScript config

## Conventions
- Use functional components with hooks
- One component per file
- Named exports only
- Tailwind CSS for styling (no CSS modules)
- Use `app/actions.ts` for server mutations
- Keep shared UI in `packages/ui`

## Commands
- Dev: pnpm dev
- Build: pnpm build
- Lint: pnpm lint
- Check: pnpm check
- Format: pnpm format
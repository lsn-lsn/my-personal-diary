This app uses Next.js 15 (App Router) with Server Actions.

## Getting Started

Install dependencies and run:

```bash
pnpm install
pnpm dev
```

Open the URL printed in terminal to test `梨树贴吧`.

## Stack

- Next.js 15 + App Router
- Server Actions
- Prisma + Session Auth
- Vercel AI SDK
- shadcn-style UI + Tailwind CSS
- Biome

## Environment

Copy `.env.example` to `.env` and set:

- `DATABASE_URL`
- `DIRECT_URL`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL` (optional, for gateway providers)
- `APP_BASE_URL` (used in password reset email links)
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` (for reset emails)

## Auth

- Register with `username + email + password`
- Login creates HttpOnly session cookie
- Forgot password: request reset by email, then open reset link to set new password
- Password reset email has HTML template; same account has 1-minute cooldown on reset requests
- Update profile from top-right `...` modal (name/avatar)

## Prisma

```bash
pnpm --filter web db:generate
pnpm --filter web db:push
```

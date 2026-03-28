# Wikimasters

Wikimasters is a full-stack wiki-style publishing app built with Next.js App Router. It combines authenticated article creation, markdown editing, image uploads, pageview tracking, AI-generated summaries, Redis caching, and production-ready Stack Auth integration.

This is not a static content site. It is a small CMS/wiki application with:

- public article browsing
- authenticated article creation and editing
- ownership-based authorization
- markdown authoring and rendering
- image uploads through Vercel Blob
- AI-generated article summaries
- pageview tracking and milestone email hooks

## What Kind Of App Is This?

Wikimasters is a full-stack authenticated wiki/CMS application.

It sits between a classic blog and an internal knowledge base:

- articles are stored in Postgres
- users authenticate through Stack Auth
- authors can create, update, and delete their own content
- readers can browse and read published content without authentication

## Core Features

- Article listing homepage with summaries
- Individual article pages with markdown rendering
- Authenticated article creation
- Authenticated article editing and deletion
- Per-article ownership checks
- Image upload support via Vercel Blob
- Redis-backed article list caching
- Redis-backed pageview counters
- AI summary generation for articles
- Auth flows handled through Stack Auth UI routes under `/handler/*`
- Celebration email trigger hooks for pageview milestones

## Architecture Overview

### Frontend

- Next.js 16 App Router
- React 19
- Server Components for data-heavy screens
- Client Components for editing, markdown input, and pageview-side effects

### Authentication

- Stack Auth via `@stackframe/stack`
- `StackProvider` and `StackTheme` are mounted in the root layout
- Default auth routes are served from `src/app/handler/[...stack]/page.tsx`
- The app uses cookie-based auth with `tokenStore: "nextjs-cookie"`

### Database

- Neon Postgres
- Drizzle ORM for schema and queries
- Migrations stored in `drizzle/`
- Local app user records mirrored into `usersSync` for FK-safe content ownership

### Caching And Counters

- Upstash Redis for article list caching
- Upstash Redis for pageview counters

### File Storage

- Vercel Blob for uploaded article images

### Email

- Resend is configured for app email delivery
- Milestone pageview emails are wired through the email layer

### AI

- AI summaries are generated through the `ai` SDK
- The app currently calls `generateText()` with the model string `openai/gpt-5-nano`
- The AI summary job lives in `src/app/api/summary/route.ts`

## AI Provider Usage

There is AI usage in the app.

### Where AI Is Used

- `src/ai/summarize.ts`
- `src/app/actions/articles.ts`
- `src/app/api/summary/route.ts`

### What It Does

- When an article is created or updated, the app attempts to generate a concise summary.
- There is also a batch route that finds articles without summaries and generates them.

### Which Provider Is Used?

In first-party application code, the active model string is:

```ts
model: "openai/gpt-5-nano"
```

Important nuance:

- `AI_GATEWAY_API_KEY` exists in environment templates, but it is not referenced directly in `src/**`.
- The app code uses the `ai` package, and any gateway behavior is indirect through that SDK stack.
- `@ai-sdk/anthropic` is installed, but there is no first-party code currently using Anthropic in `src/**`.

## Tech Stack

- Next.js 16
- React 19
- TypeScript 5
- Drizzle ORM
- Neon Postgres
- Stack Auth
- Upstash Redis
- Vercel Blob
- Resend
- Tailwind CSS v4
- Radix UI primitives
- `@uiw/react-md-editor`
- `react-markdown`
- `lucide-react`
- Vitest
- Playwright
- Biome

## Project Structure

```text
src/
	ai/                  AI helpers
	app/                 Next.js App Router pages, routes, and server actions
		actions/           Server mutations
		api/               Route handlers
		handler/           Stack Auth UI routes
		wiki/              Wiki pages and editor routes
	cache/               Redis cache setup
	components/          Reusable UI and feature components
	db/                  DB schema, authz, sync helpers, seed support
	email/               Email integrations and templates
	lib/data/            Read-layer queries
	stack/               Stack Auth client/server app setup
drizzle/               SQL migrations and snapshots
test/                  Unit and E2E tests
```

## Key Application Flows

### 1. Browsing Articles

- Homepage loads articles via `src/lib/data/articles.ts`
- Article list is cached in Redis under `articles:all`
- Article cards link to `/wiki/[id]`

### 2. Creating An Article

- User signs in through Stack Auth
- Editor UI submits to `createArticle()` in `src/app/actions/articles.ts`
- User is synced into `usersSync`
- Article is inserted into Postgres
- AI summary is attempted
- List cache is invalidated

### 3. Editing Or Deleting An Article

- Ownership is checked through `authorizeUserToEditArticle()`
- Only the article author can mutate the article

### 4. Uploading Images

- Editor sends a file to the `uploadFile()` server action
- File is validated and uploaded to Vercel Blob
- Returned public URL is stored on the article

### 5. Pageview Tracking

- Article pages increment a Redis counter
- Milestones trigger a non-blocking email hook

## Installation

### Prerequisites

- Node.js 20+
- npm 10+
- A Neon Postgres database
- A Stack Auth project
- An Upstash Redis database
- A Vercel Blob store
- A Resend account if you want emails to work

### Install Dependencies

```bash
npm install
```

The repo uses `patch-package` in `postinstall`, so dependency patches are applied automatically after install.

## Environment Setup

Create a local environment file:

```bash
cp .env.example .env.local
```

Then fill in the values.

### Required Variables

```bash
NEXT_PUBLIC_STACK_PROJECT_ID=
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=
STACK_SECRET_SERVER_KEY=

DATABASE_URL=

BLOB_READ_WRITE_TOKEN=
BLOB_BASE_URL=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

RESEND_API_KEY=

AI_GATEWAY_API_KEY=
CRON_SECRET=
```

Notes:

- `BLOB_BASE_URL` is required at build time because `next.config.ts` asserts it.
- `DATABASE_URL` is required for Drizzle migrations.
- `CRON_SECRET` protects the summary batch route outside development.
- `AI_GATEWAY_API_KEY` is present in the environment template, but it is not referenced directly in first-party app code.

## Database Creation And Setup

### 1. Create The Database

Use Neon or any compatible Postgres instance.

If using Neon:

1. Create a new Neon project
2. Copy the connection string
3. Set it as `DATABASE_URL`

### 2. Run Migrations

```bash
npm run db:migrate
```

### 3. Seed The Database

```bash
npm run db:seed
```

Seeding will:

- truncate the `articles` table
- ensure a default seed user exists in `usersSync`
- insert 25 sample articles
- resync the article ID sequence

### 4. Start The App

```bash
npm run dev
```

Visit:

- `http://localhost:3000`
- `http://localhost:3000/handler/sign-up`

### Build Requirement

This project will fail the build if `BLOB_BASE_URL` is unset.

## Testing And Validation

### Typecheck

```bash
npm run typecheck
```

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### Full CI-Style Check

```bash
npm run test:ci
```

See `test/e2e/README.md` for the Neon branch strategy and test environment setup.

## Styling Conventions

The app uses a utility-first styling system with design tokens layered on top.

### Styling Stack

- Tailwind CSS v4
- CSS custom properties defined in `src/app/globals.css`
- `tw-animate-css` for animation utilities
- `tailwind-merge` and `clsx` for class composition

### Design Approach

- Neutral palette based on CSS variables
- Shared semantic tokens like `--background`, `--foreground`, `--border`, and `--muted`
- Consistent radius tokens via `--radius`
- Light and dark theme variables are defined globally

### UI Libraries

- Radix UI primitives for composable accessible components
- Custom UI components in `src/components/ui`
- `@uiw/react-md-editor` for markdown authoring
- `react-markdown` for markdown rendering
- `lucide-react` for icons
- `next/font/google` with Geist and Geist Mono

## Auth And Stack Dashboard Setup

### Stack Auth Basics

This app uses the default Stack Auth handler route:

```text
/handler
```

That means Stack-hosted auth flows redirect users back into pages like:

- `/handler/sign-in`
- `/handler/sign-up`
- `/handler/account-settings`

### Production Domain Setup In Stack Dashboard

When moving to production, go to the Stack dashboard and configure:

#### Domain & Handlers

Add your production domain to `Trusted Domains`.

Example:

```text
https://www.fullstack-next-wiki-phi.vercel.app
```

If you later add a custom domain, add that domain too.

Do not leave the trusted domain list empty in production. If it is empty, Stack will reject redirects with errors like:

```json
{
	"code": "REDIRECT_URL_NOT_WHITELISTED",
	"error": "Redirect URL not whitelisted. Did you forget to add this domain to the trusted domains list on the Stack Auth dashboard?"
}
```

#### Development Setting

`Allow all localhost callbacks for development` can stay enabled for local work, but it should be disabled for a stricter production posture.

### GitHub OAuth Setup For Stack Auth

This is the production sequence that matters:

1. Your app redirects the user into Stack Auth
2. Stack Auth redirects the user to GitHub
3. GitHub redirects back to Stack Auth
4. Stack Auth redirects back to your app domain

#### GitHub OAuth App Callback URL

In GitHub, configure the OAuth app callback URL to Stack Auth's callback endpoint for GitHub:

```text
https://api.stack-auth.com/api/v1/auth/oauth/callback/github
```

That callback URL is not your Vercel app URL.

#### Stack Dashboard OAuth Provider Config

In Stack dashboard:

1. Go to `Auth Methods`
2. Open `GitHub`
3. Switch from shared keys to custom keys
4. Enter your GitHub OAuth app client ID and client secret

#### Trusted Redirect Domain

The domain Stack needs whitelisted for the final redirect is your app domain, for example:

```text
https://www.fullstack-next-wiki-phi.vercel.app
```

### Required Stack Env Vars

Copy these from the Stack dashboard into your environment:

- `NEXT_PUBLIC_STACK_PROJECT_ID`
- `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`
- `STACK_SECRET_SERVER_KEY`

## Production Checklist

Before promoting the app to production, verify all of the following:

- Production domain added to Stack `Trusted Domains`
- GitHub OAuth app created with Stack's callback URL
- GitHub client credentials entered in Stack `Auth Methods`
- `DATABASE_URL` points to the production database
- `BLOB_BASE_URL` and `BLOB_READ_WRITE_TOKEN` configured
- Redis credentials configured
- Resend configured if milestone emails are needed
- `CRON_SECRET` configured for the summary route
- `npm run build` passes in the production environment
- Database migrations have been run
- Seed data is not accidentally applied to production

## Known Production-Sensitive Integrations

### Vercel Blob

- uploads rely on `@vercel/blob`
- image rendering depends on `BLOB_BASE_URL` being in `next.config.ts`

### Redis

- article list cache key: `articles:all`
- pageview keys: `pageviews:article:{id}`

### Stack Auth

- relies on trusted domains being configured in Stack dashboard
- production OAuth requires custom provider keys rather than shared development keys

## Current Limitations

- There is no admin dashboard yet
- Article slugs are placeholder-like and currently generated from `Date.now()`
- Pageview emails are wired as milestone hooks but broader notification management is still minimal
- The AI summary flow is useful but simple and does not yet support provider switching in the UI

## Recommended Next Features

### 1. Admin Dashboard

An admin dashboard is the most natural next major feature.

It could include:

- article moderation
- user management
- analytics overview
- pageview trends
- failed summary job monitoring
- cache and queue visibility
- feature flags for auth and AI behavior

### 2. Better Content Model

- draft vs published workflow
- tags and categories
- richer slugs
- search indexing

### 3. Editorial Tooling

- scheduled publishing
- revision history
- audit logs
- media library

### 4. AI Enhancements

- provider abstraction in configuration
- summary regeneration controls in admin UI
- richer summarization prompts
- article recommendation or semantic search

## Important Files

- `src/app/page.tsx`: homepage article listing
- `src/app/handler/[...stack]/page.tsx`: Stack Auth route handler
- `src/app/actions/articles.ts`: article mutations
- `src/app/actions/upload.ts`: image upload action
- `src/app/actions/pageviews.ts`: pageview counters and email trigger hook
- `src/app/api/summary/route.ts`: summary batch route
- `src/ai/summarize.ts`: AI summary implementation
- `src/lib/data/articles.ts`: article read layer
- `src/db/schema.ts`: database schema
- `src/stack/client.tsx`: Stack client app
- `src/stack/server.tsx`: Stack server app
- `next.config.ts`: dev-origin allowlist and image remote pattern config
- `drizzle.config.ts`: migration config

## Deployment Summary

If you are deploying this to Vercel, the minimal safe order is:

1. Provision Neon, Upstash, Vercel Blob, Stack, and optional Resend
2. Set all required environment variables in Vercel
3. Add the production domain to Stack trusted domains
4. Configure GitHub OAuth in GitHub and Stack
5. Run database migrations against production
6. Deploy
7. Hit `/handler/sign-up` and verify the auth round-trip
8. Verify image upload, article creation, and summary generation


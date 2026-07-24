# Project Description

## What This Application Does

**Curator** is a personal **media capture & triage** utility. It removes the friction of
saving media (articles, books, movies, games) for later by pairing a single frictionless
input bar with a rapid classification flow that keeps a digital backlog under control.

## Business Domain

- **Core problem solved**: capturing raw notes/links instantly, then triaging them into
  categories so nothing piles up unsorted.
- **Users**: a single user (personal utility).
- **Primary surface**: mobile-optimized web app.

## Key Business Entity

The whole product is modeled by a **single entity**: the `MediaItem`. Every captured note or
link is a `MediaItem` that moves through a two-state lifecycle: **inbox → organized**.


| Entity | Description |
|--------|-------------|
| `MediaItem` | A single capture — either free text or a web link — that is first placed in the Inbox, then triaged into a category and moved to the Vault, or deleted. |

### `MediaItem` Fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | identifier | Primary key |
| `content` | string | Raw captured text (text items) or the URL (link items) |
| `type` | `TEXT` \| `LINK` | Determines the card render variant |
| `url` | string \| null | Populated for link items |
| `title` | string \| null | Extracted webpage title; `null` when extraction failed (fallback to raw link) |
| `category` | `MOVIE` \| `BOOK` \| `GAME` \| `ARTICLE` \| null | `null` while the item is still in the Inbox |
| `status` | `INBOX` \| `ORGANIZED` | Drives Inbox vs Vault placement |
| `createdAt` | timestamp | Sort key — lists are newest-first |

### Fixed Enumerations (hard-coded — see out-of-scope)

- **MediaType**: `TEXT`, `LINK`
- **Category**: `MOVIE`, `BOOK`, `GAME`, `ARTICLE`
- **Status**: `INBOX`, `ORGANIZED`

## Business Rules (Critical)

Agents MUST respect these when generating code:

- **Link detection is server-authoritative.** The client may detect a URL for instant UX, but
  the backend re-validates and is the source of truth for `type` and `url`.
- **Title extraction is best-effort with a mandatory fallback.** If fetching/parsing the page
  title fails (timeout, non-HTML, error), store/display the **raw link** — never block a capture.
- **Inbox and Vault are ordered newest-first** (`createdAt DESC`).
- **Triage is atomic**: tapping a category sets `category` **and** `status = ORGANIZED` in one
  action, which removes the item from the Inbox result set.
- **Delete is permanent and immediate** — a single action, no soft-delete, no trash bin.
- **Categories are a closed set.** Only the four fixed categories exist; do not add custom or
  user-defined categories.

## Core Features

| Feature | Description |
|---------|-------------|
| **All-Capture Bar** | Prominent top-of-layout input accepting text; auto-detects links. |
| **Inbox** | Default screen listing unorganized items, newest first, as text or rich-link cards. |
| **Triage** | Per-card row of four category buttons + a delete action. |
| **Sorted Vault** | Secondary screen listing organized items with an `All / Movies / Books / Games / Articles` filter dropdown. |

## Explicitly Out of Scope (MVP)

Deferred to post-MVP — do **not** build these, and do not add code paths for them:

- User registration, login, profiles, or account management (**no auth**).
- Image attachments, photo uploads, or camera integration (**no file storage**).
- User-created custom categories (**category enum is closed**).
- Website thumbnail imagery or branding icons on link cards (**title text only**).

## Environments

| Environment | Purpose | Notes |
|-------------|---------|-------|
| local | Developer machine | Frontend dev server + backend on `localhost`; SQLite file DB |

> A single local environment is sufficient for the MVP. Staging/production are deferred.

## Key Decisions Already Made

See [`DECISIONS.md`](./DECISIONS.md) for the authoritative log. Summary:

- **Monorepo**: npm workspaces — `apps/web` (frontend) + `apps/api` (backend).
- **Frontend**: React 18+ / TypeScript (Vite SPA), TanStack Query, Zustand, Tailwind CSS, Zod.
- **Backend**: Node.js / TypeScript, Fastify, layered structure, Prisma, Pino, Zod.
- **Database**: SQLite via Prisma for the MVP; PostgreSQL-ready as a config-only swap.
- **No authentication, no uploads** — per out-of-scope above.

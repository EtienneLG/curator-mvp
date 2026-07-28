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
| `MediaItem` | A single free-form capture (any text — a note or a URL, with no upfront distinction) that is first placed in the Inbox, then triaged (with refined metadata) into a category and moved to the Library, or deleted. |

### `MediaItem` Fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | identifier | Primary key |
| `content` | string | Raw captured input, verbatim — free text or a URL; there is no separate stored `type`/`url` field, the shape of `content` is only inspected at refine time (see Business Rules) |
| `title` | string \| null | Set only during refine/triage — from a web suggestion or manual entry; `null` until the item is refined |
| `category` | `MOVIE` \| `BOOK` \| `GAME` \| `ARTICLE` \| null | `null` while the item is still in the Inbox |
| `year` | number \| null | Release/publication year; refined via triage, from a suggestion or manual entry; `null` until set |
| `creator` | string \| null | Author / director / developer, depending on category; refined via triage; `null` until set |
| `description` | string \| null | Short synopsis/summary; refined via triage; `null` until set |
| `status` | `INBOX` \| `ORGANIZED` | Drives Inbox vs Library placement |
| `createdAt` | timestamp | Sort key — lists are newest-first by default |

### Fixed Enumerations (hard-coded — see out-of-scope)

- **Category**: `MOVIE`, `BOOK`, `GAME`, `ARTICLE`
- **Status**: `INBOX`, `ORGANIZED`

> There is no `MediaType` enum and no `type`/`url` fields — capture has a single input shape.
> See `DECISIONS.md` DEC-016.

## Business Rules (Critical)

Agents MUST respect these when generating code:

- **Capture is a single, undifferentiated input.** There is no text-vs-link distinction at
  capture time — `POST` just persists the raw `content` string with `status = INBOX`. No link
  detection, no title extraction, no suggestion lookup happens at capture.
- **URL-vs-media branching happens only at refine time.** When the user opens the refine-metadata
  modal, the backend inspects `content`: if it parses as a URL, it fetches the webpage and
  extracts title/description; otherwise, it calls the external "determine media" suggestion
  lookup (movie/book/game/article). Both branches are best-effort (see next rule).
- **Web suggestions are best-effort and never block refine/triage.** If the URL fetch or media
  lookup fails, is slow, or returns nothing, the refine-metadata modal must still open with
  empty/editable fields — a failed or missing suggestion never blocks triage or capture.
  (External provider(s) TBD — see `DECISIONS.md` DEC-016.)
- **Inbox and Library are ordered newest-first by default** (`createdAt DESC`); the Library also
  supports explicit sort selection (see Library filter feature below).
- **Triage is atomic and metadata-carrying**: validating an item in the refine-metadata modal sets
  `category`, `title`, `year`, `creator`, `description`, **and** `status = ORGANIZED` in one
  action, which removes the item from the Inbox result set.
- **Delete is permanent and immediate** — a single inline action on the Inbox card, independent of
  the refine-metadata modal, no soft-delete, no trash bin.
- **Categories are a closed set.** Only the four fixed categories exist; do not add custom or
  user-defined categories.

## Core Features

| Feature | Description |
|---------|-------------|
| **All-Capture Bar** | Prominent top-of-layout input accepting any free-form text or URL — a single, undifferentiated capture; no client/server type branching at capture time. |
| **Inbox** | Default screen listing unorganized items, newest first, as uniform cards; content that looks like a URL is cosmetically auto-linkified client-side for display only (no stored field, no business meaning). |
| **Refine & Triage Modal** | Tapping an Inbox card triggers the backend's best-effort suggestion lookup (URL → fetch webpage; otherwise → "determine media" lookup) and opens a modal showing the raw capture and any suggestions, with editable fields (category, title, year, creator, description). A **Validate** action commits the refined metadata and moves the item to the Library. |
| **Delete** | Inline action on the Inbox card, separate from the modal. |
| **Library** *(previously "Library")* | Secondary screen listing organized items with their full refined metadata, with an `All / Movies / Books / Games / Articles` category filter and a sort filter (newest/oldest by capture date, newest/oldest by year, title A–Z/Z–A). |
| **Bottom Navbar** | Fixed navigation bar for switching between Inbox and Library. |

## Explicitly Out of Scope (MVP)

Deferred to post-MVP — do **not** build these, and do not add code paths for them:

- User registration, login, profiles, or account management (**no auth**).
- Image attachments, photo uploads, or camera integration (**no file storage**).
- User-created custom categories (**category enum is closed**).
- Website thumbnail imagery, poster art, or branding icons on cards (**text metadata only** —
  web suggestions return text fields such as title/year/creator/description, never images).

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

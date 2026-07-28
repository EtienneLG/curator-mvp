import { z } from 'zod';

// Naming/structure mirrors apps/web/src/types/media-item.types.ts — the `MediaItem` contract
// is modeled once (conceptually) with Zod and kept in the same shape on both sides
// (docs/AI-RULES.md — "model it once with Zod and mirror the shape on each side").

/**
 * Domain enums for `MediaItem` (see docs/PROJECT.md → Fixed Enumerations).
 * Closed sets — do not add values without an explicit product decision.
 */
export const MediaTypeSchema = z.enum(['TEXT', 'LINK']);
export type MediaType = z.infer<typeof MediaTypeSchema>;

export const CategorySchema = z.enum(['MOVIE', 'BOOK', 'GAME', 'ARTICLE']);
export type Category = z.infer<typeof CategorySchema>;

export const StatusSchema = z.enum(['INBOX', 'ORGANIZED']);
export type Status = z.infer<typeof StatusSchema>;

/**
 * `MediaItem` — the single business entity in Curator (docs/PROJECT.md).
 * Response DTO shape returned by the API; mirrors the Prisma model.
 */
export const MediaItemSchema = z.object({
  id: z.string(),
  content: z.string(),
  type: MediaTypeSchema,
  url: z.string().nullable(),
  title: z.string().nullable(),
  category: CategorySchema.nullable(),
  status: StatusSchema,
  createdAt: z.date(),
});

export type MediaItem = z.infer<typeof MediaItemSchema>;

// Client input for capture: only raw content is supplied. `type`/`url` are server-detected
// (link detection is server-authoritative) and `status`/`title` are business-owned defaults.
export const CaptureItemSchema = z.object({
  content: z.string().trim().min(1, 'content is required'),
});

export type CaptureItemInput = z.infer<typeof CaptureItemSchema>;

// Query params for listing items by status (e.g. `GET /items?status=inbox`). Accepts a
// case-insensitive `status` so both the Inbox and future Library screens can share this route;
// the raw input is uppercased before being validated against the closed `Status` enum.
export const ListItemsQuerySchema = z.object({
  status: z
    .string()
    .transform((value) => value.toUpperCase())
    .pipe(StatusSchema),
});

export type ListItemsQuery = z.infer<typeof ListItemsQuerySchema>;

// Path params for `PATCH /items/:id` (and any future single-item route).
export const ItemParamsSchema = z.object({
  id: z.string().trim().min(1, 'id is required'),
});

export type ItemParams = z.infer<typeof ItemParamsSchema>;

// Triage: tapping a category sets `category` and `status = ORGANIZED` atomically
// (docs/PROJECT.md — Triage business rule). Only the closed `Category` set is accepted.
export const TriageItemSchema = z.object({
  category: CategorySchema,
});

export type TriageItemInput = z.infer<typeof TriageItemSchema>;

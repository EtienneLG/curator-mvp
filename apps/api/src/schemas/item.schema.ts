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

import { z } from 'zod';

/**
 * Domain enums for `MediaItem` (see docs/PROJECT.md → Fixed Enumerations).
 * Closed sets — do not add values without an explicit product decision.
 */
export const CategorySchema = z.enum(['MOVIE', 'BOOK', 'GAME', 'ARTICLE']);
export type Category = z.infer<typeof CategorySchema>;

export const StatusSchema = z.enum(['INBOX', 'ORGANIZED']);
export type Status = z.infer<typeof StatusSchema>;

/**
 * `MediaItem` — the single business entity in Curator (docs/PROJECT.md).
 * Source of truth for runtime validation; TypeScript type is inferred below.
 */
export const MediaItemSchema = z.object({
  id: z.string(),
  content: z.string(),
  title: z.string().nullable(),
  category: CategorySchema.nullable(),
  year: z.number().int().nullable(),
  creator: z.string().nullable(),
  description: z.string().nullable(),
  status: StatusSchema,
  createdAt: z.coerce.date(),
});

export type MediaItem = z.infer<typeof MediaItemSchema>;

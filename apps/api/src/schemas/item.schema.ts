import { z } from 'zod';

export const CategorySchema = z.enum(['MOVIE', 'BOOK', 'GAME', 'ARTICLE']);
export type Category = z.infer<typeof CategorySchema>;

export const StatusSchema = z.enum(['INBOX', 'ORGANIZED']);
export type Status = z.infer<typeof StatusSchema>;

/**
 * Response DTO shape returned by the API; mirrors the Prisma model.
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
  createdAt: z.date(),
});

export type MediaItem = z.infer<typeof MediaItemSchema>;

// Client input for capture: only raw content is supplied; status/title and the rest of the
// metadata are business-owned defaults set later.
export const CaptureItemSchema = z.object({
  content: z.string().trim().min(1, 'content is required'),
});

export type CaptureItemInput = z.infer<typeof CaptureItemSchema>;

// Case-insensitive `status` so Inbox and future Library screens can share this route.
export const ListItemsQuerySchema = z.object({
  status: z
    .string()
    .transform((value) => value.toUpperCase())
    .pipe(StatusSchema),
});

export type ListItemsQuery = z.infer<typeof ListItemsQuerySchema>;

export const ItemParamsSchema = z.object({
  id: z.string().trim().min(1, 'id is required'),
});

export type ItemParams = z.infer<typeof ItemParamsSchema>;

// Triage sets category/title/year/creator/description and status = ORGANIZED atomically.
// `title` is always set at triage; year/creator/description are optional/nullable.
export const TriageItemSchema = z.object({
  category: CategorySchema,
  title: z.string().trim().min(1, 'title is required'),
  year: z.number().int().nullable().optional(),
  creator: z.string().trim().nullable().optional(),
  description: z.string().trim().nullable().optional(),
});

export type TriageItemInput = z.infer<typeof TriageItemSchema>;

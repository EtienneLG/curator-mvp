import { z } from 'zod';

// Closed sets — do not add values without an explicit product decision.
export const CategorySchema = z.enum(['MOVIE', 'BOOK', 'GAME', 'ARTICLE']);
export type Category = z.infer<typeof CategorySchema>;

export const StatusSchema = z.enum(['INBOX', 'ORGANIZED']);
export type Status = z.infer<typeof StatusSchema>;

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

// The All-Capture Bar accepts any free-form text or URL as a single string; no type branching here.
export const CaptureInputSchema = z.object({
  content: z.string().trim().min(1, 'Enter something to capture'),
});

export type CaptureInput = z.infer<typeof CaptureInputSchema>;

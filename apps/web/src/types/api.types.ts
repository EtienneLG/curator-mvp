import { z } from 'zod';

import { MediaItemSchema } from './media-item.types';

export const ItemListResponseSchema = z.array(MediaItemSchema);
export type ItemListResponse = z.infer<typeof ItemListResponseSchema>;

// Mirrors the backend's centralized error handler shape; stack traces are never included.
export const ApiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

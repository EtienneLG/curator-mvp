import { z } from 'zod';

import { MediaItemSchema } from './media-item.types';

/**
 * Response contract for list endpoints (`GET /items?status=inbox`,
 * `GET /items?status=organized`). Validate at the service boundary before
 * data reaches hooks/components (see AGENTS.md → API Integration).
 */
export const ItemListResponseSchema = z.array(MediaItemSchema);
export type ItemListResponse = z.infer<typeof ItemListResponseSchema>;

/**
 * Backend error shape — centralized Fastify error handler always responds
 * with `{ error: { code, message, details } }` (docs/ARCHITECTURE.md →
 * Backend Architecture → Error Flow). Stack traces are never included.
 */
export const ApiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

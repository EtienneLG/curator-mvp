import type { FastifyReply, FastifyRequest } from 'fastify';

import type { CaptureItemInput } from '../schemas/item.schema.js';
import type { ItemsService } from '../services/items.service.js';

// Thin: validate → delegate → respond. Body validation now happens at the Fastify layer
// (route `schema.body`, see routes/items.route.ts) via fastify-type-provider-zod; invalid
// requests never reach this handler and are mapped to `{ error: { code: 'VALIDATION_ERROR',
// ... } }` by the centralized error handler.
export function createPostItem(itemsService: ItemsService) {
  return async function postItem(
    request: FastifyRequest<{ Body: CaptureItemInput }>,
    reply: FastifyReply,
  ) {
    const item = await itemsService.capture(request.body);
    reply.status(201).send(item);
  };
}

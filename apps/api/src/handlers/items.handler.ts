import type { FastifyReply, FastifyRequest } from 'fastify';

import { CaptureItemSchema } from '../schemas/item.schema.js';
import type { ItemsService } from '../services/items.service.js';

// Thin: validate → delegate → respond. `ZodError` from `.parse()` bubbles to the centralized
// error handler (mapped to 400 `{ error: { code: 'VALIDATION_ERROR', ... } }`).
export function createPostItem(itemsService: ItemsService) {
  return async function postItem(request: FastifyRequest, reply: FastifyReply) {
    const input = CaptureItemSchema.parse(request.body);
    const item = await itemsService.capture(input);
    reply.status(201).send(item);
  };
}

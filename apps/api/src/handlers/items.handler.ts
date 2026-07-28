import type { FastifyReply, FastifyRequest } from 'fastify';

import type { CaptureItemInput, ItemParams, ListItemsQuery, TriageItemInput } from '../schemas/item.schema.js';
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

// Thin: validate → delegate → respond. Query validation happens at the Fastify layer
// (route `schema.querystring`, see routes/items.route.ts) via fastify-type-provider-zod.
export function createGetItems(itemsService: ItemsService) {
  return async function getItems(
    request: FastifyRequest<{ Querystring: ListItemsQuery }>,
    reply: FastifyReply,
  ) {
    const items = await itemsService.list(request.query);
    reply.status(200).send(items);
  };
}

// Thin: validate → delegate → respond. Params/body validation happens at the Fastify layer
// (route `schema.params`/`schema.body`, see routes/items.route.ts) via fastify-type-provider-zod.
export function createPatchItem(itemsService: ItemsService) {
  return async function patchItem(
    request: FastifyRequest<{ Params: ItemParams; Body: TriageItemInput }>,
    reply: FastifyReply,
  ) {
    const item = await itemsService.triage(request.params.id, request.body);
    reply.status(200).send(item);
  };
}

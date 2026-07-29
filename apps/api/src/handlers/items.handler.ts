import type { FastifyReply, FastifyRequest } from 'fastify';

import type { CaptureItemInput, ItemParams, ListItemsQuery, TriageItemInput } from '../schemas/item.schema.js';
import type { ItemsService } from '../services/items.service.js';

// Thin: validate (at the route schema layer) → delegate → respond.
export function createPostItem(itemsService: ItemsService) {
  return async function postItem(
    request: FastifyRequest<{ Body: CaptureItemInput }>,
    reply: FastifyReply,
  ) {
    const item = await itemsService.capture(request.body);
    reply.status(201).send(item);
  };
}

export function createGetItems(itemsService: ItemsService) {
  return async function getItems(
    request: FastifyRequest<{ Querystring: ListItemsQuery }>,
    reply: FastifyReply,
  ) {
    const items = await itemsService.list(request.query);
    reply.status(200).send(items);
  };
}

export function createGetItemSuggestions(itemsService: ItemsService) {
  return async function getItemSuggestions(
    request: FastifyRequest<{ Params: ItemParams }>,
    reply: FastifyReply,
  ) {
    const suggestion = await itemsService.getSuggestions(request.params.id);
    reply.status(200).send(suggestion);
  };
}

export function createPatchItem(itemsService: ItemsService) {
  return async function patchItem(
    request: FastifyRequest<{ Params: ItemParams; Body: TriageItemInput }>,
    reply: FastifyReply,
  ) {
    const item = await itemsService.triage(request.params.id, request.body);
    reply.status(200).send(item);
  };
}

export function createDeleteItem(itemsService: ItemsService) {
  return async function deleteItem(
    request: FastifyRequest<{ Params: ItemParams }>,
    reply: FastifyReply,
  ) {
    await itemsService.remove(request.params.id);
    reply.status(204).send();
  };
}

import type { FastifyPluginAsync } from 'fastify';

import { createPostItem } from '../handlers/items.handler.js';
import { ItemsRepository } from '../repositories/items.repository.js';
import { ItemsService } from '../services/items.service.js';

// No Fastify-level JSON-schema validation is attached here (no zod-to-JSON-schema/type-provider
// dependency is installed yet — see AGENTS.md "no dependencies without explicit mention").
// The handler validates the body directly with the Zod schema instead.
export const itemsRoute: FastifyPluginAsync = async (app) => {
  const itemsService = new ItemsService(new ItemsRepository());

  app.post('/items', createPostItem(itemsService));
};

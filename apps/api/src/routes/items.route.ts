import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { createGetItems, createPostItem } from '../handlers/items.handler.js';
import { ItemsRepository } from '../repositories/items.repository.js';
import { CaptureItemSchema, ListItemsQuerySchema, MediaItemSchema } from '../schemas/item.schema.js';
import { ItemsService } from '../services/items.service.js';

export const itemsRoute: FastifyPluginAsync = async (app) => {
  const itemsService = new ItemsService(new ItemsRepository());

  app.withTypeProvider<ZodTypeProvider>().post('/items', {
      schema: {
        body: CaptureItemSchema,
        response: { 201: MediaItemSchema }
      }
    },
    createPostItem(itemsService),
  );

  app.withTypeProvider<ZodTypeProvider>().get('/items', {
      schema: {
        querystring: ListItemsQuerySchema,
        response: { 200: z.array(MediaItemSchema) }
      }
    },
    createGetItems(itemsService),
  );
};

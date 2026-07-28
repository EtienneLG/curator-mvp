import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { createGetItems, createPatchItem, createPostItem } from '../handlers/items.handler.js';
import { ItemsRepository } from '../repositories/items.repository.js';
import {
  CaptureItemSchema,
  ItemParamsSchema,
  ListItemsQuerySchema,
  MediaItemSchema,
  TriageItemSchema,
} from '../schemas/item.schema.js';
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

  app.withTypeProvider<ZodTypeProvider>().patch('/items/:id', {
      schema: {
        params: ItemParamsSchema,
        body: TriageItemSchema,
        response: { 200: MediaItemSchema }
      }
    },
    createPatchItem(itemsService),
  );
};

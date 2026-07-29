import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { Env } from '../config/env.js';
import {
  createDeleteItem,
  createGetItems,
  createGetItemSuggestions,
  createPatchItem,
  createPostItem,
} from '../handlers/items.handler.js';
import { ItemsRepository } from '../repositories/items.repository.js';
import {
  CaptureItemSchema,
  ItemParamsSchema,
  ListItemsQuerySchema,
  MediaItemSchema,
  TriageItemSchema,
} from '../schemas/item.schema.js';
import { SuggestionSchema } from '../schemas/suggestion.schema.js';
import { ItemsService } from '../services/items.service.js';
import { GeminiClassifier } from '../services/suggestion-providers/gemini.classifier.js';
import { createProviderRegistry } from '../services/suggestion-providers/provider-registry.js';
import { SuggestionsService } from '../services/suggestions.service.js';

// Routes are the composition root that wires services together; `env` supplies provider
// credentials/timeout, mirroring the `(env) => FastifyPluginAsync` pattern used by `corsPlugin`.
export function itemsRoute(env: Env): FastifyPluginAsync {
  return async (app) => {
    const geminiClassifier = new GeminiClassifier(env.GEMINI_API_KEY, env.SUGGESTION_TIMEOUT_MS);
    const providerRegistry = createProviderRegistry(env);
    const suggestionsService = new SuggestionsService(
      geminiClassifier,
      providerRegistry,
      env.SUGGESTION_TIMEOUT_MS,
    );
    const itemsService = new ItemsService(new ItemsRepository(), suggestionsService);

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

    app.withTypeProvider<ZodTypeProvider>().get('/items/:id/suggestions', {
        schema: {
          params: ItemParamsSchema,
          response: { 200: SuggestionSchema }
        }
      },
      createGetItemSuggestions(itemsService),
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

    app.withTypeProvider<ZodTypeProvider>().delete('/items/:id', {
        schema: {
          params: ItemParamsSchema,
          response: { 204: z.void() }
        }
      },
      createDeleteItem(itemsService),
    );
  };
}

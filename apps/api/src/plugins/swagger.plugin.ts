import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import type { FastifyPluginAsync } from 'fastify';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

// Minimal OpenAPI docs setup (per docs/AI-RULES.md). `jsonSchemaTransform` converts route
// schemas built from Zod (see routes/items.route.ts) into valid OpenAPI/JSON-schema.
//
// `@fastify/swagger`'s `onRoute` hook only observes routes registered within its own
// encapsulation context (and children); sibling plugins registered after it in app.ts
// (health/items routes) would otherwise be invisible to it. Setting the `skip-override`
// symbol hoists this plugin to the root context so it sees every route, same technique
// used by `errorHandlerPlugin`.
export const swaggerPlugin: FastifyPluginAsync = async (app) => {
  await app.register(fastifySwagger, {
    openapi: {
      info: { title: 'Curator API', version: '0.0.0' },
    },
    transform: jsonSchemaTransform,
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });
};

(swaggerPlugin as unknown as Record<symbol, boolean>)[Symbol.for('skip-override')] = true;

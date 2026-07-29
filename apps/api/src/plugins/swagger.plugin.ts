import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import type { FastifyPluginAsync } from 'fastify';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

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

// Hoists this plugin to the root encapsulation context so it sees every route registered
// after it (health/items), the same technique used by errorHandlerPlugin.
(swaggerPlugin as unknown as Record<symbol, boolean>)[Symbol.for('skip-override')] = true;

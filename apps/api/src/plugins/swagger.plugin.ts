import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import type { FastifyPluginAsync } from 'fastify';

// Minimal OpenAPI docs setup (per docs/AI-RULES.md). No route schemas beyond /health exist
// yet — this will pick up Zod-derived schemas as business routes are added.
export const swaggerPlugin: FastifyPluginAsync = async (app) => {
  await app.register(fastifySwagger, {
    openapi: {
      info: { title: 'Curator API', version: '0.0.0' },
    },
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });
};

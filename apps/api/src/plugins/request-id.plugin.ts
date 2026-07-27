import { randomUUID } from 'node:crypto';

import type { FastifyPluginAsync } from 'fastify';

// Attaches/propagates a correlation ID for structured logs (Pino), preferring an
// inbound `x-request-id` header when present so requests can be traced end-to-end.
export const requestIdPlugin: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', async (request, reply) => {
    const requestId = (request.headers['x-request-id'] as string | undefined) ?? randomUUID();
    request.id = requestId;
    reply.header('x-request-id', requestId);
  });
};

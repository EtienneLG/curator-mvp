import type { FastifyPluginAsync } from 'fastify';
import { ZodError } from 'zod';

import { AppError } from '../lib/errors.js';

// Centralized error mapping: services throw typed AppError subclasses (or Zod validation
// errors surface from route schema parsing); everything else is an unexpected 500.
// Response shape is always `{ error: { code, message, details } }` — stack traces never leak.
//
// `setErrorHandler` only applies to the encapsulation context it's registered in (and its
// children) by default. Setting the `skip-override` symbol (the same mechanism the
// `fastify-plugin` package uses internally) hoists this plugin to the root context so it
// applies to every route, without adding a new dependency.
export const errorHandlerPlugin: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      request.log.warn({ err: error, code: error.code }, 'handled business error');
      reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message, details: error.details },
      });
      return;
    }

    if (error instanceof ZodError) {
      request.log.warn({ err: error }, 'validation error');
      reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.issues },
      });
      return;
    }

    request.log.error({ err: error }, 'unhandled error');
    reply.status(500).send({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  });
};

(errorHandlerPlugin as unknown as Record<symbol, boolean>)[Symbol.for('skip-override')] = true;

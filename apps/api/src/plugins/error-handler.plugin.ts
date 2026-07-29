import type { FastifyPluginAsync } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { ZodError } from 'zod';

import { AppError } from '../lib/errors.js';

// Maps AppError subclasses, Fastify/Zod validation errors, and unexpected errors to a
// consistent `{ error: { code, message, details } }` shape; stack traces never leak.
export const errorHandlerPlugin: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      request.log.warn({ err: error, code: error.code }, 'handled business error');
      reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message, details: error.details },
      });
      return;
    }

    if (hasZodFastifySchemaValidationErrors(error)) {
      request.log.warn({ err: error }, 'validation error');
      reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.validation },
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

// Hoists this plugin to the root encapsulation context so it applies to every route,
// not just the context it's registered in.
(errorHandlerPlugin as unknown as Record<symbol, boolean>)[Symbol.for('skip-override')] = true;

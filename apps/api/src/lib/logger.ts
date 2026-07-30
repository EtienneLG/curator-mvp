import pino from 'pino';
import type { FastifyBaseLogger } from 'fastify';

import type { Env } from '../config/env.js';

export function createLogger(env: Pick<Env, 'NODE_ENV'>) {
  return pino({
    level: env.NODE_ENV === 'test' ? 'silent' : 'info',
    transport:
      env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  });
}

// `FastifyBaseLogger` (not `ReturnType<typeof createLogger>`) so this type also fits
// `request.log`, the request-scoped child logger threaded through the suggestion pipeline.
export type Logger = FastifyBaseLogger;

import pino from 'pino';

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

export type Logger = ReturnType<typeof createLogger>;

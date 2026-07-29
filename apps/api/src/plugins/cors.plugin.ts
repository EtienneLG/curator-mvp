import fastifyCors from '@fastify/cors';
import type { FastifyPluginAsync } from 'fastify';

import type { Env } from '../config/env.js';

// Restricted to the single configured WEB_ORIGIN rather than a wildcard.
export function corsPlugin(env: Env): FastifyPluginAsync {
  const plugin: FastifyPluginAsync = async (app) => {
    await app.register(fastifyCors, {
      origin: env.WEB_ORIGIN,
      // @fastify/cors defaults to GET,HEAD,POST only; PATCH/DELETE must be listed or
      // browsers block the preflight.
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    });
  };

  (plugin as unknown as Record<symbol, boolean>)[Symbol.for('skip-override')] = true;

  return plugin;
}

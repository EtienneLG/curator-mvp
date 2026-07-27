import fastifyCors from '@fastify/cors';
import type { FastifyPluginAsync } from 'fastify';

import type { Env } from '../config/env.js';

// Allows the apps/web dev/prod origin (env.WEB_ORIGIN) to call this API from the browser.
// Restricted to the single configured origin rather than a wildcard, since credentials-less
// wildcards would still be looser than needed for a single-known-frontend setup.
//
// `@fastify/cors`'s hooks only apply to the encapsulation context they're registered in (and
// its children) by default; sibling routes registered after it in app.ts (health/items) would
// otherwise not get CORS headers. Setting the `skip-override` symbol hoists this plugin to the
// root context so it applies to every route, same technique used by `errorHandlerPlugin` and
// `swaggerPlugin`.
export function corsPlugin(env: Env): FastifyPluginAsync {
  const plugin: FastifyPluginAsync = async (app) => {
    await app.register(fastifyCors, { origin: env.WEB_ORIGIN });
  };

  (plugin as unknown as Record<symbol, boolean>)[Symbol.for('skip-override')] = true;

  return plugin;
}

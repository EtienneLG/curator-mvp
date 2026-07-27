import fastify from 'fastify';

import type { Env } from './config/env.js';
import { createLogger } from './lib/logger.js';
import { errorHandlerPlugin } from './plugins/error-handler.plugin.js';
import { requestIdPlugin } from './plugins/request-id.plugin.js';
import { swaggerPlugin } from './plugins/swagger.plugin.js';
import { healthRoute } from './routes/health.route.js';
import { itemsRoute } from './routes/items.route.js';

// Builds (but does not start) the Fastify app: registers plugins and routes only.
// Kept separate from server.ts so tests can `app.inject()` without binding a port.
export async function buildApp(env: Env) {
  const app = fastify({ loggerInstance: createLogger(env) });

  await app.register(requestIdPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(swaggerPlugin);
  await app.register(healthRoute);
  await app.register(itemsRoute);

  return app;
}

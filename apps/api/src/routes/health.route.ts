import type { FastifyPluginAsync } from 'fastify';

import { getHealth } from '../handlers/health.handler.js';

export const healthRoute: FastifyPluginAsync = async (app) => {
  app.get('/health', getHealth);
};

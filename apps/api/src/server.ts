import { buildApp } from './app.js';
import { loadEnv } from './config/env.js';
import { disconnectPrisma } from './lib/prisma.js';

async function main() {
  const env = loadEnv();
  const app = await buildApp(env);

  await app.listen({ port: env.PORT, host: '0.0.0.0' });

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'shutting down');
    await app.close();
    await disconnectPrisma();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((error: unknown) => {
  // No logger instance exists yet if startup fails this early (e.g. invalid env) —
  // write directly to stderr instead of using console (banned per docs/CONVENTIONS.md).
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});

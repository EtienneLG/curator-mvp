import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    env: {
      DATABASE_URL: 'file:./test.db',
      PORT: '3000',
      NODE_ENV: 'test',
      GEMINI_API_KEY: 'test-gemini-api-key',
      TMDB_API_KEY: 'test-tmdb-api-key',
      IGDB_CLIENT_ID: 'test-igdb-client-id',
      IGDB_CLIENT_SECRET: 'test-igdb-client-secret',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});

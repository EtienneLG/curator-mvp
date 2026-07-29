import { z } from 'zod';

// Zod validates process.env at startup so the app fails fast on missing/malformed config.
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  WEB_ORIGIN: z.string().min(1).default('http://localhost:5173'),

  // Suggestion pipeline (DEC-016): Gemini classifies content, then a category-specific
  // provider (TMDB/Open Library/IGDB) supplies metadata. All required — the pipeline fails
  // fast at startup rather than at request time if misconfigured.
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  TMDB_API_KEY: z.string().min(1, 'TMDB_API_KEY is required'),
  IGDB_CLIENT_ID: z.string().min(1, 'IGDB_CLIENT_ID is required'),
  IGDB_CLIENT_SECRET: z.string().min(1, 'IGDB_CLIENT_SECRET is required'),
  // Shared per-call timeout budget (ms) for every external suggestion call (Gemini + each
  // provider) — enforces the DEC-016 best-effort guarantee that a slow provider never blocks
  // the refine-metadata modal for long.
  SUGGESTION_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Invalid environment configuration:\n${details.join('\n')}`);
  }

  return result.data;
}

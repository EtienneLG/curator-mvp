import { z } from 'zod';

import { CategorySchema } from './item.schema.js';

/**
 * Every field is best-effort and nullable — a failed/partial lookup returns nulls rather than
 * an error, and must never block the refine-metadata modal from opening.
 */
export const SuggestionSchema = z.object({
  category: CategorySchema.nullable(),
  title: z.string().nullable(),
  year: z.number().int().nullable(),
  creator: z.string().nullable(),
  description: z.string().nullable(),
});

export type Suggestion = z.infer<typeof SuggestionSchema>;

// Shared fallback returned whenever a step of the pipeline fails/times out/finds no match, so
// every failure path returns the exact same shape.
export const EMPTY_SUGGESTION: Suggestion = {
  category: null,
  title: null,
  year: null,
  creator: null,
  description: null,
};

/**
 * Gemini's classification output: a category plus a search query for the matching provider.
 * Never includes title/year/creator/description itself.
 */
export const GeminiClassificationSchema = z.object({
  category: CategorySchema,
  searchQuery: z.string().trim().min(1),
});

export type GeminiClassification = z.infer<typeof GeminiClassificationSchema>;

/**
 * Normalized metadata a category-specific provider (TMDB/Open Library/IGDB) returns after
 * mapping its own raw API response into this common shape (`services/suggestion-providers/types.ts`).
 */
export const ProviderMetadataSchema = z.object({
  title: z.string().nullable(),
  year: z.number().int().nullable(),
  creator: z.string().nullable(),
  description: z.string().nullable(),
});

export type ProviderMetadata = z.infer<typeof ProviderMetadataSchema>;

/**
 * Raw TMDB `/search/movie` response — only the fields consumed by `tmdb.provider.ts` are
 * modeled.
 */
export const TmdbSearchResponseSchema = z.object({
  results: z.array(
    z.object({
      title: z.string(),
      release_date: z.string().optional(),
      overview: z.string().optional(),
    }),
  ),
});

export type TmdbSearchResponse = z.infer<typeof TmdbSearchResponseSchema>;

/**
 * Raw Open Library `/search.json` response — only the fields consumed by
 * `open-library.provider.ts` are modeled.
 */
export const OpenLibrarySearchResponseSchema = z.object({
  docs: z.array(
    z.object({
      title: z.string(),
      first_publish_year: z.number().int().optional(),
      author_name: z.array(z.string()).optional(),
    }),
  ),
});

export type OpenLibrarySearchResponse = z.infer<typeof OpenLibrarySearchResponseSchema>;

/**
 * Raw IGDB `/games` response — only fields consumed by `igdb.provider.ts` are modeled.
 * IGDB dates are unix seconds; `involved_companies` carries the developer/publisher name.
 */
export const IgdbSearchResponseSchema = z.array(
  z.object({
    name: z.string(),
    first_release_date: z.number().int().optional(),
    summary: z.string().optional(),
    involved_companies: z.array(z.object({ company: z.object({ name: z.string() }) })).optional(),
  }),
);

export type IgdbSearchResponse = z.infer<typeof IgdbSearchResponseSchema>;

/**
 * Raw Twitch OAuth client-credentials token response, consumed by `igdb.provider.ts` to
 * authenticate against the IGDB API (IGDB reuses Twitch's identity platform).
 */
export const TwitchTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
});

export type TwitchTokenResponse = z.infer<typeof TwitchTokenResponseSchema>;

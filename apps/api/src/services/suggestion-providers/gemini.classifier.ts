import { GoogleGenAI, Type } from '@google/genai';

import { GeminiClassificationSchema, type GeminiClassification } from '../../schemas/suggestion.schema.js';
import { withTimeout } from './types.js';

// gemini-2.5-flash is the fastest/cheapest current model — appropriate for a classification-only
// task (category + search query), not open-ended generation.
const MODEL = 'gemini-2.5-flash';

// Structured-output schema (Gemini's OpenAPI-subset `Schema` type, not Zod) — constrains the
// model to return exactly `{ category, searchQuery }` as `application/json`. `category` is
// restricted to the closed Curator enum so Gemini can only ever pick a category we support.
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    category: {
      type: Type.STRING,
      enum: ['MOVIE', 'BOOK', 'GAME', 'ARTICLE'],
      description: 'Which of Curator\'s four closed media categories this content most likely is.',
    },
    searchQuery: {
      type: Type.STRING,
      description:
        'A concise search query to look up this item in a category-specific database ' +
        '(e.g. a movie/book/game title guess for MOVIE/BOOK/GAME, or a short title/topic ' +
        'guess for ARTICLE).',
    },
  },
  required: ['category', 'searchQuery'],
};

const SYSTEM_INSTRUCTION =
  'You classify a short piece of free-form text captured by a personal media-tracking app. ' +
  'Decide which single category it most likely refers to (MOVIE, BOOK, GAME, or ARTICLE), and ' +
  'produce a concise search query suitable for looking it up in a category-specific database ' +
  '(TMDB for movies, Open Library for books, IGDB for games). Do not invent a year, author, ' +
  'director, developer, or description — only classify and produce a search query.';

// Used strictly as a classifier: given raw `content`, returns a category plus a search query
// for the matching provider. Best-effort — any failure or malformed output resolves to `null`.
export class GeminiClassifier {
  private readonly client: GoogleGenAI;

  constructor(
    apiKey: string,
    private readonly timeoutMs: number,
  ) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async classify(content: string): Promise<GeminiClassification | null> {
    return withTimeout(this.timeoutMs, async (signal) => {
      const response = await this.client.models.generateContent({
        model: MODEL,
        contents: content,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          // Deterministic output — this is closed-set classification (pick 1 of 4 categories +
          // a short search query), not creative generation, so the same `content` should
          // classify the same way every time.
          temperature: 0,
          // No tools (search grounding/code execution/function calling) — Gemini must classify from `content` alone.
          tools: [],
          abortSignal: signal,
        },
      });

      const text = response.text;
      if (!text) {
        return null;
      }

      // Gemini's JSON output is untrusted external input — validate with Zod before trusting it.
      const parsed: unknown = JSON.parse(text);
      const result = GeminiClassificationSchema.safeParse(parsed);
      return result.success ? result.data : null;
    });
  }
}

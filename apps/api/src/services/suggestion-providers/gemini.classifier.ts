import { GoogleGenAI, Type } from '@google/genai';

import type { Logger } from '../../lib/logger.js';
import { GeminiClassificationSchema, type GeminiClassification } from '../../schemas/suggestion.schema.js';
import { truncateForLog, withTimeout } from './types.js';

const MODEL = 'gemini-3.1-flash-lite';

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

const SYSTEM_INSTRUCTION = `
You are a precise data extraction assistant for a media-tracking app. Analyze the user's short, free-form thought and extract the media type and the exact title.

### Categories
Select exactly ONE: MOVIE, BOOK, GAME, ARTICLE, or UNKNOWN.

### Extraction Rules
1. Title Extraction: Extract the title strictly WORD-FOR-WORD as it appears in the text. 
2. No Guessing/Completion: Do not fix typos, do not add missing subtitles, and do not autocomplete the title. If the user writes "harry potter 1", extract "harry potter 1", NOT "Harry Potter and the Sorcerer's Stone".
`;

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

  async classify(content: string, logger: Logger): Promise<GeminiClassification | null> {
    logger.info({ stage: 'gemini-classify', content: truncateForLog(content) }, 'Calling Gemini classifier');

    const result = await withTimeout(
      this.timeoutMs,
      async (signal) => {
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
          logger.warn({ stage: 'gemini-classify' }, 'Gemini classifier returned an empty response');
          return null;
        }

        // Gemini's JSON output is untrusted external input — validate with Zod before trusting it.
        const parsed: unknown = JSON.parse(text);
        const result = GeminiClassificationSchema.safeParse(parsed);
        if (!result.success) {
          logger.warn({ stage: 'gemini-classify' }, 'Gemini classifier response failed schema validation');
          return null;
        }
        return result.data;
      },
      logger,
      { stage: 'gemini-classify' },
    );

    if (result) {
      logger.info(
        { stage: 'gemini-classify', category: result.category, searchQuery: result.searchQuery },
        'Gemini classifier resolved a category and search query',
      );
    }

    return result;
  }
}

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Logger } from '../../../src/lib/logger.js';

const API_KEY = 'super-secret-gemini-key';

const generateContent = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(function GoogleGenAI() {
    return { models: { generateContent } };
  }),
  Type: { OBJECT: 'OBJECT', STRING: 'STRING' },
}));

function buildLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as Logger;
}

describe('GeminiClassifier', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('logs the call and the resolved classification on success, without ever logging the API key', async () => {
    const { GeminiClassifier } = await import('../../../src/services/suggestion-providers/gemini.classifier.js');
    generateContent.mockResolvedValue({ text: JSON.stringify({ category: 'MOVIE', searchQuery: 'Dune 2021' }) });

    const classifier = new GeminiClassifier(API_KEY, 1000);
    const logger = buildLogger();

    const result = await classifier.classify('a movie about a desert planet', logger);

    expect(result).toEqual({ category: 'MOVIE', searchQuery: 'Dune 2021' });
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ stage: 'gemini-classify' }), 'Calling Gemini classifier');
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'MOVIE', searchQuery: 'Dune 2021' }),
      expect.any(String),
    );
    const loggedInfo = (logger.info as ReturnType<typeof vi.fn>).mock.calls.flat();
    expect(JSON.stringify(loggedInfo)).not.toContain(API_KEY);
  });

  it('logs a warning and returns null when the response fails schema validation', async () => {
    const { GeminiClassifier } = await import('../../../src/services/suggestion-providers/gemini.classifier.js');
    generateContent.mockResolvedValue({ text: JSON.stringify({ unexpected: true }) });

    const classifier = new GeminiClassifier(API_KEY, 1000);
    const logger = buildLogger();

    const result = await classifier.classify('some content', logger);

    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ stage: 'gemini-classify' }), expect.any(String));
  });
});

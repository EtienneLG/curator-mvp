import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../src/app.js';
import { loadEnv } from '../../src/config/env.js';
import { prisma } from '../../src/lib/prisma.js';

describe('[POST /items]', () => {
  afterEach(async () => {
    await prisma.mediaItem.deleteMany();
  });

  it('captures a text item and returns 201', async () => {
    const app = await buildApp(loadEnv());

    const response = await app.inject({
      method: 'POST',
      url: '/items',
      payload: { content: 'remember to read this' },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.type).toBe('TEXT');
    expect(body.url).toBeNull();
    expect(body.title).toBeNull();
    expect(body.status).toBe('INBOX');

    await app.close();
  });

  it('captures a link item, server-detecting type and url', async () => {
    const app = await buildApp(loadEnv());

    const response = await app.inject({
      method: 'POST',
      url: '/items',
      payload: { content: 'https://example.com/article' },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.type).toBe('LINK');
    expect(body.url).toBe('https://example.com/article');

    await app.close();
  });

  it('returns a 400 validation error when content is missing', async () => {
    const app = await buildApp(loadEnv());

    const response = await app.inject({ method: 'POST', url: '/items', payload: {} });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');

    await app.close();
  });
});

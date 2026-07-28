import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../src/app.js';
import { loadEnv } from '../../src/config/env.js';
import { prisma } from '../../src/lib/prisma.js';

describe('[POST /items]', () => {
  afterEach(async () => {
    await prisma.mediaItem.deleteMany();
  });

  it('captures an item, persisting only content, and returns 201', async () => {
    const app = await buildApp(loadEnv());

    const response = await app.inject({
      method: 'POST',
      url: '/items',
      payload: { content: 'remember to read this' },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.content).toBe('remember to read this');
    expect(body.title).toBeNull();
    expect(body.category).toBeNull();
    expect(body.year).toBeNull();
    expect(body.creator).toBeNull();
    expect(body.description).toBeNull();
    expect(body.status).toBe('INBOX');

    await app.close();
  });

  it('captures a URL-shaped content string as plain content, with no special handling', async () => {
    const app = await buildApp(loadEnv());

    const response = await app.inject({
      method: 'POST',
      url: '/items',
      payload: { content: 'https://example.com/article' },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.content).toBe('https://example.com/article');
    expect(body.status).toBe('INBOX');

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

describe('[GET /items]', () => {
  afterEach(async () => {
    await prisma.mediaItem.deleteMany();
  });

  it('returns only INBOX items for a lowercase status query, newest-first', async () => {
    const app = await buildApp(loadEnv());

    await app.inject({ method: 'POST', url: '/items', payload: { content: 'first inbox note' } });
    await app.inject({ method: 'POST', url: '/items', payload: { content: 'second inbox note' } });

    const response = await app.inject({ method: 'GET', url: '/items?status=inbox' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveLength(2);
    expect(body.every((item: { status: string }) => item.status === 'INBOX')).toBe(true);
    expect(body[0].content).toBe('second inbox note');

    await app.close();
  });

  it('returns only ORGANIZED items when status=ORGANIZED', async () => {
    const app = await buildApp(loadEnv());

    await prisma.mediaItem.create({
      data: {
        content: 'organized note',
        title: 'A Great Article',
        status: 'ORGANIZED',
        category: 'ARTICLE',
      },
    });
    await app.inject({ method: 'POST', url: '/items', payload: { content: 'inbox note' } });

    const response = await app.inject({ method: 'GET', url: '/items?status=ORGANIZED' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveLength(1);
    expect(body[0].status).toBe('ORGANIZED');

    await app.close();
  });

  it('returns a 400 validation error when status is missing', async () => {
    const app = await buildApp(loadEnv());

    const response = await app.inject({ method: 'GET', url: '/items' });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');

    await app.close();
  });

  it('returns a 400 validation error when status is not a recognized value', async () => {
    const app = await buildApp(loadEnv());

    const response = await app.inject({ method: 'GET', url: '/items?status=archived' });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');

    await app.close();
  });
});

describe('[PATCH /items/:id]', () => {
  afterEach(async () => {
    await prisma.mediaItem.deleteMany();
  });

  it('triages an item: sets all refined fields, status ORGANIZED, and removes it from the Inbox', async () => {
    const app = await buildApp(loadEnv());

    const captureResponse = await app.inject({
      method: 'POST',
      url: '/items',
      payload: { content: 'a movie to watch' },
    });
    const { id } = captureResponse.json();

    const response = await app.inject({
      method: 'PATCH',
      url: `/items/${id}`,
      payload: {
        category: 'MOVIE',
        title: 'A Great Movie',
        year: 2020,
        creator: 'A Director',
        description: 'A short synopsis',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.category).toBe('MOVIE');
    expect(body.title).toBe('A Great Movie');
    expect(body.year).toBe(2020);
    expect(body.creator).toBe('A Director');
    expect(body.description).toBe('A short synopsis');
    expect(body.status).toBe('ORGANIZED');

    const inboxResponse = await app.inject({ method: 'GET', url: '/items?status=inbox' });
    expect(inboxResponse.json()).toHaveLength(0);

    await app.close();
  });

  it('returns a 404 error when the item does not exist', async () => {
    const app = await buildApp(loadEnv());

    const response = await app.inject({
      method: 'PATCH',
      url: '/items/does-not-exist',
      payload: { category: 'BOOK', title: 'A Book' },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('NOT_FOUND');

    await app.close();
  });

  it('returns a 400 validation error when category is not a recognized value', async () => {
    const app = await buildApp(loadEnv());

    const captureResponse = await app.inject({
      method: 'POST',
      url: '/items',
      payload: { content: 'something to triage' },
    });
    const { id } = captureResponse.json();

    const response = await app.inject({
      method: 'PATCH',
      url: `/items/${id}`,
      payload: { category: 'PODCAST', title: 'A Title' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');

    await app.close();
  });

  it('returns a 400 validation error when title is missing', async () => {
    const app = await buildApp(loadEnv());

    const captureResponse = await app.inject({
      method: 'POST',
      url: '/items',
      payload: { content: 'something to triage' },
    });
    const { id } = captureResponse.json();

    const response = await app.inject({
      method: 'PATCH',
      url: `/items/${id}`,
      payload: { category: 'BOOK' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');

    await app.close();
  });
});

describe('[DELETE /items/:id]', () => {
  afterEach(async () => {
    await prisma.mediaItem.deleteMany();
  });

  it('deletes an existing item and returns 204', async () => {
    const app = await buildApp(loadEnv());

    const captureResponse = await app.inject({
      method: 'POST',
      url: '/items',
      payload: { content: 'something to delete' },
    });
    const { id } = captureResponse.json();

    const response = await app.inject({ method: 'DELETE', url: `/items/${id}` });

    expect(response.statusCode).toBe(204);

    const inboxResponse = await app.inject({ method: 'GET', url: '/items?status=inbox' });
    expect(inboxResponse.json()).toHaveLength(0);

    await app.close();
  });

  it('returns a 404 error when the item does not exist', async () => {
    const app = await buildApp(loadEnv());

    const response = await app.inject({ method: 'DELETE', url: '/items/does-not-exist' });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('NOT_FOUND');

    await app.close();
  });
});

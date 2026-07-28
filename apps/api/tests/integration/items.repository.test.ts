import { afterEach, describe, expect, it } from 'vitest';

import { prisma } from '../../src/lib/prisma.js';
import { ItemsRepository } from '../../src/repositories/items.repository.js';

describe('ItemsRepository', () => {
  afterEach(async () => {
    await prisma.mediaItem.deleteMany();
  });

  it('persists a captured item and defaults status to INBOX', async () => {
    const repository = new ItemsRepository();

    const item = await repository.create({
      content: 'https://example.com/article',
      type: 'LINK',
      url: 'https://example.com/article',
      title: null,
      status: 'INBOX',
    });

    expect(item.id).toBeTypeOf('string');
    expect(item.status).toBe('INBOX');
    expect(item.category).toBeNull();
    expect(item.createdAt).toBeInstanceOf(Date);

    const stored = await prisma.mediaItem.findUnique({ where: { id: item.id } });
    expect(stored?.content).toBe('https://example.com/article');
    expect(stored?.type).toBe('LINK');
  });

  it('findByStatus returns only matching items, newest-first', async () => {
    const repository = new ItemsRepository();

    const older = await repository.create({
      content: 'first inbox note',
      type: 'TEXT',
      url: null,
      title: null,
      status: 'INBOX',
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const newer = await repository.create({
      content: 'second inbox note',
      type: 'TEXT',
      url: null,
      title: null,
      status: 'INBOX',
    });
    await repository.create({
      content: 'an organized item',
      type: 'TEXT',
      url: null,
      title: null,
      status: 'ORGANIZED',
    });

    const inboxItems = await repository.findByStatus('INBOX');

    expect(inboxItems).toHaveLength(2);
    expect(inboxItems.map((item) => item.id)).toEqual([newer.id, older.id]);
    expect(inboxItems.every((item) => item.status === 'INBOX')).toBe(true);
  });

  it('updateCategory sets category and status ORGANIZED for an existing item', async () => {
    const repository = new ItemsRepository();

    const created = await repository.create({
      content: 'a note to triage',
      type: 'TEXT',
      url: null,
      title: null,
      status: 'INBOX',
    });

    const updated = await repository.updateCategory(created.id, 'ARTICLE');

    expect(updated?.category).toBe('ARTICLE');
    expect(updated?.status).toBe('ORGANIZED');

    const stored = await prisma.mediaItem.findUnique({ where: { id: created.id } });
    expect(stored?.category).toBe('ARTICLE');
    expect(stored?.status).toBe('ORGANIZED');
  });

  it('updateCategory returns null for an unknown id', async () => {
    const repository = new ItemsRepository();

    const updated = await repository.updateCategory('does-not-exist', 'MOVIE');

    expect(updated).toBeNull();
  });
});

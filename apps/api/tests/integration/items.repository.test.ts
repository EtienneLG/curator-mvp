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
      status: 'INBOX',
    });

    expect(item.id).toBeTypeOf('string');
    expect(item.status).toBe('INBOX');
    expect(item.category).toBeNull();
    expect(item.title).toBeNull();
    expect(item.year).toBeNull();
    expect(item.creator).toBeNull();
    expect(item.description).toBeNull();
    expect(item.createdAt).toBeInstanceOf(Date);

    const stored = await prisma.mediaItem.findUnique({ where: { id: item.id } });
    expect(stored?.content).toBe('https://example.com/article');
  });

  it('findByStatus returns only matching items, newest-first', async () => {
    const repository = new ItemsRepository();

    const older = await repository.create({ content: 'first inbox note', status: 'INBOX' });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const newer = await repository.create({ content: 'second inbox note', status: 'INBOX' });
    await repository.create({ content: 'an organized item', status: 'ORGANIZED' });

    const inboxItems = await repository.findByStatus('INBOX');

    expect(inboxItems).toHaveLength(2);
    expect(inboxItems.map((item) => item.id)).toEqual([newer.id, older.id]);
    expect(inboxItems.every((item) => item.status === 'INBOX')).toBe(true);
  });

  it('findById returns the matching item or null', async () => {
    const repository = new ItemsRepository();

    const created = await repository.create({ content: 'a note', status: 'INBOX' });

    const found = await repository.findById(created.id);
    expect(found?.id).toBe(created.id);

    const notFound = await repository.findById('does-not-exist');
    expect(notFound).toBeNull();
  });

  it('updateTriage sets all refined fields and status ORGANIZED for an existing item', async () => {
    const repository = new ItemsRepository();

    const created = await repository.create({ content: 'a note to triage', status: 'INBOX' });

    const updated = await repository.updateTriage(created.id, {
      category: 'ARTICLE',
      title: 'A Great Article',
      year: 2021,
      creator: 'An Author',
      description: 'A short synopsis',
    });

    expect(updated?.category).toBe('ARTICLE');
    expect(updated?.title).toBe('A Great Article');
    expect(updated?.year).toBe(2021);
    expect(updated?.creator).toBe('An Author');
    expect(updated?.description).toBe('A short synopsis');
    expect(updated?.status).toBe('ORGANIZED');

    const stored = await prisma.mediaItem.findUnique({ where: { id: created.id } });
    expect(stored?.category).toBe('ARTICLE');
    expect(stored?.status).toBe('ORGANIZED');
  });

  it('updateTriage returns null for an unknown id', async () => {
    const repository = new ItemsRepository();

    const updated = await repository.updateTriage('does-not-exist', {
      category: 'MOVIE',
      title: 'Title',
      year: null,
      creator: null,
      description: null,
    });

    expect(updated).toBeNull();
  });

  it('delete removes an existing item', async () => {
    const repository = new ItemsRepository();

    const created = await repository.create({ content: 'a note to delete', status: 'INBOX' });

    const deleted = await repository.delete(created.id);
    expect(deleted?.id).toBe(created.id);

    const stored = await prisma.mediaItem.findUnique({ where: { id: created.id } });
    expect(stored).toBeNull();
  });

  it('delete returns null for an unknown id', async () => {
    const repository = new ItemsRepository();

    const deleted = await repository.delete('does-not-exist');

    expect(deleted).toBeNull();
  });
});

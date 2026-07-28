import { describe, expect, it, vi } from 'vitest';

import { NotFoundError } from '../../src/lib/errors.js';
import type { ItemsRepository } from '../../src/repositories/items.repository.js';
import { ItemsService } from '../../src/services/items.service.js';

function buildRepository() {
  const create = vi.fn(async (data) => ({
    id: 'item-1',
    category: null,
    createdAt: new Date('2026-07-27T00:00:00.000Z'),
    ...data,
  }));
  const findByStatus = vi.fn(async (status) => [
    {
      id: 'item-1',
      content: 'note',
      type: 'TEXT',
      url: null,
      title: null,
      category: null,
      status,
      createdAt: new Date('2026-07-27T00:00:00.000Z'),
    },
  ]);
  const updateCategory = vi.fn(async (id: string, category: string) =>
    ({
      id,
      content: 'note',
      type: 'TEXT',
      url: null,
      title: null,
      category,
      status: 'ORGANIZED',
      createdAt: new Date('2026-07-27T00:00:00.000Z'),
    }) as Record<string, unknown> | null,
  );
  return {
    create,
    findByStatus,
    updateCategory,
    asItemsRepository: { create, findByStatus, updateCategory } as unknown as ItemsRepository,
  };
}

describe('ItemsService', () => {
  it('captures a text item with type TEXT and no url', async () => {
    const { create, asItemsRepository } = buildRepository();
    const service = new ItemsService(asItemsRepository);

    const item = await service.capture({ content: 'just a plain note' });

    expect(item.type).toBe('TEXT');
    expect(item.url).toBeNull();
    expect(create).toHaveBeenCalledWith({
      content: 'just a plain note',
      type: 'TEXT',
      url: null,
      title: null,
      status: 'INBOX',
    });
  });

  it('captures a link item with type LINK and the raw url', async () => {
    const { create, asItemsRepository } = buildRepository();
    const service = new ItemsService(asItemsRepository);

    const item = await service.capture({ content: 'https://example.com/article' });

    expect(item.type).toBe('LINK');
    expect(item.url).toBe('https://example.com/article');
    expect(create).toHaveBeenCalledWith({
      content: 'https://example.com/article',
      type: 'LINK',
      url: 'https://example.com/article',
      title: null,
      status: 'INBOX',
    });
  });

  it('always sets title to null (title extraction deferred) and status to INBOX', async () => {
    const { create, asItemsRepository } = buildRepository();
    const service = new ItemsService(asItemsRepository);

    await service.capture({ content: 'https://example.com' });

    const [payload] = create.mock.calls[0] ?? [];
    expect(payload.title).toBeNull();
    expect(payload.status).toBe('INBOX');
  });

  it('treats a non-http(s) scheme as plain text, not a link', async () => {
    const { asItemsRepository } = buildRepository();
    const service = new ItemsService(asItemsRepository);

    const item = await service.capture({ content: 'ftp://example.com/file' });

    expect(item.type).toBe('TEXT');
    expect(item.url).toBeNull();
  });

  it('lists items by status, delegating to the repository', async () => {
    const { findByStatus, asItemsRepository } = buildRepository();
    const service = new ItemsService(asItemsRepository);

    const items = await service.list({ status: 'INBOX' });

    expect(findByStatus).toHaveBeenCalledWith('INBOX');
    expect(items).toHaveLength(1);
    expect(items[0]?.status).toBe('INBOX');
  });

  it('triages an item, setting category and status ORGANIZED via the repository', async () => {
    const { updateCategory, asItemsRepository } = buildRepository();
    const service = new ItemsService(asItemsRepository);

    const item = await service.triage('item-1', { category: 'MOVIE' });

    expect(updateCategory).toHaveBeenCalledWith('item-1', 'MOVIE');
    expect(item.category).toBe('MOVIE');
    expect(item.status).toBe('ORGANIZED');
  });

  it('throws NotFoundError when the repository finds no matching item', async () => {
    const { asItemsRepository, updateCategory } = buildRepository();
    updateCategory.mockResolvedValueOnce(null);
    const service = new ItemsService(asItemsRepository);

    await expect(service.triage('missing-id', { category: 'MOVIE' })).rejects.toThrow(
      NotFoundError,
    );
  });
});

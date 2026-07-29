import { describe, expect, it, vi } from 'vitest';

import { NotFoundError } from '../../src/lib/errors.js';
import type { ItemsRepository } from '../../src/repositories/items.repository.js';
import { ItemsService } from '../../src/services/items.service.js';
import type { SuggestionsService } from '../../src/services/suggestions.service.js';

function buildSuggestionsService() {
  const suggest = vi.fn();
  return { suggest, asSuggestionsService: { suggest } as unknown as SuggestionsService };
}

function buildRepository() {
  const create = vi.fn(async (data) => ({
    id: 'item-1',
    title: null,
    category: null,
    year: null,
    creator: null,
    description: null,
    createdAt: new Date('2026-07-27T00:00:00.000Z'),
    ...data,
  }));
  const findByStatus = vi.fn(async (status) => [
    {
      id: 'item-1',
      content: 'note',
      title: null,
      category: null,
      year: null,
      creator: null,
      description: null,
      status,
      createdAt: new Date('2026-07-27T00:00:00.000Z'),
    },
  ]);
  const updateTriage = vi.fn(async (id: string, data: Record<string, unknown>) =>
    ({
      id,
      content: 'note',
      status: 'ORGANIZED',
      createdAt: new Date('2026-07-27T00:00:00.000Z'),
      ...data,
    }) as Record<string, unknown> | null,
  );
  const deleteItem = vi.fn(async (id: string) =>
    ({ id, content: 'note', status: 'INBOX' }) as Record<string, unknown> | null,
  );
  const findById = vi.fn(async (id: string) =>
    ({
      id,
      content: 'note',
      title: null,
      category: null,
      year: null,
      creator: null,
      description: null,
      status: 'INBOX',
      createdAt: new Date('2026-07-27T00:00:00.000Z'),
    }) as Record<string, unknown> | null,
  );
  return {
    create,
    findByStatus,
    updateTriage,
    deleteItem,
    findById,
    asItemsRepository: {
      create,
      findByStatus,
      updateTriage,
      delete: deleteItem,
      findById,
    } as unknown as ItemsRepository,
  };
}

describe('ItemsService', () => {
  it('captures an item, persisting only content and status INBOX', async () => {
    const { create, asItemsRepository } = buildRepository();
    const { asSuggestionsService } = buildSuggestionsService();
    const service = new ItemsService(asItemsRepository, asSuggestionsService);

    await service.capture({ content: 'just a plain note' });

    expect(create).toHaveBeenCalledWith({
      content: 'just a plain note',
      status: 'INBOX',
    });
  });

  it('captures a URL-shaped content string without any special handling', async () => {
    const { create, asItemsRepository } = buildRepository();
    const { asSuggestionsService } = buildSuggestionsService();
    const service = new ItemsService(asItemsRepository, asSuggestionsService);

    await service.capture({ content: 'https://example.com/article' });

    expect(create).toHaveBeenCalledWith({
      content: 'https://example.com/article',
      status: 'INBOX',
    });
  });

  it('lists items by status, delegating to the repository', async () => {
    const { findByStatus, asItemsRepository } = buildRepository();
    const { asSuggestionsService } = buildSuggestionsService();
    const service = new ItemsService(asItemsRepository, asSuggestionsService);

    const items = await service.list({ status: 'INBOX' });

    expect(findByStatus).toHaveBeenCalledWith('INBOX');
    expect(items).toHaveLength(1);
    expect(items[0]?.status).toBe('INBOX');
  });

  it('triages an item, setting all refined fields and status ORGANIZED via the repository', async () => {
    const { updateTriage, asItemsRepository } = buildRepository();
    const { asSuggestionsService } = buildSuggestionsService();
    const service = new ItemsService(asItemsRepository, asSuggestionsService);

    const item = await service.triage('item-1', {
      category: 'MOVIE',
      title: 'A Great Movie',
      year: 2020,
      creator: 'A Director',
      description: 'A short synopsis',
    });

    expect(updateTriage).toHaveBeenCalledWith('item-1', {
      category: 'MOVIE',
      title: 'A Great Movie',
      year: 2020,
      creator: 'A Director',
      description: 'A short synopsis',
    });
    expect(item.category).toBe('MOVIE');
    expect(item.status).toBe('ORGANIZED');
  });

  it('throws NotFoundError when the repository finds no matching item to triage', async () => {
    const { asItemsRepository, updateTriage } = buildRepository();
    updateTriage.mockResolvedValueOnce(null);
    const { asSuggestionsService } = buildSuggestionsService();
    const service = new ItemsService(asItemsRepository, asSuggestionsService);

    await expect(
      service.triage('missing-id', { category: 'MOVIE', title: 'Title' }),
    ).rejects.toThrow(NotFoundError);
  });

  it('removes an item, delegating to the repository', async () => {
    const { deleteItem, asItemsRepository } = buildRepository();
    const { asSuggestionsService } = buildSuggestionsService();
    const service = new ItemsService(asItemsRepository, asSuggestionsService);

    await service.remove('item-1');

    expect(deleteItem).toHaveBeenCalledWith('item-1');
  });

  it('throws NotFoundError when the repository finds no matching item to delete', async () => {
    const { asItemsRepository, deleteItem } = buildRepository();
    deleteItem.mockResolvedValueOnce(null);
    const { asSuggestionsService } = buildSuggestionsService();
    const service = new ItemsService(asItemsRepository, asSuggestionsService);

    await expect(service.remove('missing-id')).rejects.toThrow(NotFoundError);
  });

  it('gets suggestions for an item, delegating content to the suggestions service', async () => {
    const { asItemsRepository, findById } = buildRepository();
    const { suggest, asSuggestionsService } = buildSuggestionsService();
    suggest.mockResolvedValueOnce({
      category: 'MOVIE',
      title: 'A Great Movie',
      year: 2020,
      creator: 'A Director',
      description: 'A short synopsis',
    });
    const service = new ItemsService(asItemsRepository, asSuggestionsService);

    const suggestion = await service.getSuggestions('item-1');

    expect(findById).toHaveBeenCalledWith('item-1');
    expect(suggest).toHaveBeenCalledWith('note');
    expect(suggestion.category).toBe('MOVIE');
  });

  it('throws NotFoundError when the repository finds no matching item for suggestions', async () => {
    const { asItemsRepository, findById } = buildRepository();
    findById.mockResolvedValueOnce(null);
    const { asSuggestionsService } = buildSuggestionsService();
    const service = new ItemsService(asItemsRepository, asSuggestionsService);

    await expect(service.getSuggestions('missing-id')).rejects.toThrow(NotFoundError);
  });
});

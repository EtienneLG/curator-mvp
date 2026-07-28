import { apiFetch } from './api-client';

import { CategorySchema, MediaItemSchema, type Category, type MediaItem } from '../types/media-item.types';
import { ItemListResponseSchema } from '../types/api.types';

/**
 * Typed API calls for the `MediaItem` resource (docs/ARCHITECTURE.md → API
 * Surface). Every response is validated with the corresponding Zod schema
 * before it reaches hooks/components — never trust the raw JSON shape.
 */

export async function getInboxItems(): Promise<MediaItem[]> {
  const data = await apiFetch<unknown>('/items?status=inbox');
  return ItemListResponseSchema.parse(data);
}

export async function getVaultItems(): Promise<MediaItem[]> {
  const data = await apiFetch<unknown>('/items?status=organized');
  return ItemListResponseSchema.parse(data);
}

export async function triageItem(id: string, category: Category): Promise<MediaItem> {
  CategorySchema.parse(category);

  const data = await apiFetch<unknown>(`/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ category }),
  });

  return MediaItemSchema.parse(data);
}

export async function deleteItem(id: string): Promise<void> {
  await apiFetch<unknown>(`/items/${id}`, { method: 'DELETE' });
}

import { apiFetch } from './api-client';

import {
  CategorySchema,
  MediaItemSchema,
  type Category,
  type CaptureInput,
  type MediaItem,
} from '../types/media-item.types';
import { ItemListResponseSchema } from '../types/api.types';

/**
 * Typed API calls for the `MediaItem` resource (docs/ARCHITECTURE.md → API
 * Surface). Every response is validated with the corresponding Zod schema
 * before it reaches hooks/components — never trust the raw JSON shape.
 */

// Triage/refine payload: sets all refined metadata + moves the item to the
// Library in one atomic action (docs/PROJECT.md → Business Rules).
export interface TriageItemInput {
  category: Category;
  title: string;
  year: number | null;
  creator: string | null;
  description: string | null;
}

export async function getInboxItems(): Promise<MediaItem[]> {
  const data = await apiFetch<unknown>('/items?status=inbox');
  return ItemListResponseSchema.parse(data);
}

export async function getLibraryItems(): Promise<MediaItem[]> {
  const data = await apiFetch<unknown>('/items?status=organized');
  return ItemListResponseSchema.parse(data);
}

export async function triageItem(id: string, input: TriageItemInput): Promise<MediaItem> {
  CategorySchema.parse(input.category);

  const data = await apiFetch<unknown>(`/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

  return MediaItemSchema.parse(data);
}

export async function deleteItem(id: string): Promise<void> {
  await apiFetch<unknown>(`/items/${id}`, { method: 'DELETE' });
}

// Capture is a single, undifferentiated persist of raw `content` with
// `status = INBOX` — no link detection or metadata resolution happens here
// (docs/PROJECT.md → Business Rules).
export async function captureItem(input: CaptureInput): Promise<MediaItem> {
  const data = await apiFetch<unknown>('/items', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return MediaItemSchema.parse(data);
}

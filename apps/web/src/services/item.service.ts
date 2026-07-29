import { apiFetch } from './api-client';

import {
  CategorySchema,
  MediaItemSchema,
  type Category,
  type CaptureInput,
  type MediaItem,
} from '../types/media-item.types';
import { ItemListResponseSchema } from '../types/api.types';

// Triage/refine: sets all refined metadata and moves the item to the Library in one atomic action.
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

// Capture is a single, undifferentiated persist of raw `content` with `status = INBOX`.
export async function captureItem(input: CaptureInput): Promise<MediaItem> {
  const data = await apiFetch<unknown>('/items', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return MediaItemSchema.parse(data);
}

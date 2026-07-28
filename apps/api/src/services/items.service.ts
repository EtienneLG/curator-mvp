import { NotFoundError } from '../lib/errors.js';
import type { CaptureItemInput, ListItemsQuery, TriageItemInput } from '../schemas/item.schema.js';
import type { ItemsRepository } from '../repositories/items.repository.js';

export class ItemsService {
  constructor(private readonly itemsRepository: ItemsRepository) {}

  // Captures a new MediaItem. Capture is a single, undifferentiated input — `POST` just
  // persists the raw `content` string with `status = INBOX`; no link detection, no metadata
  // lookup, no network call happens here (docs/PROJECT.md — Business Rules).
  async capture(input: CaptureItemInput) {
    return this.itemsRepository.create({
      content: input.content,
      status: 'INBOX',
    });
  }

  // Lists MediaItems filtered by status (e.g. Inbox: status=INBOX), newest-first.
  async list(query: ListItemsQuery) {
    return this.itemsRepository.findByStatus(query.status);
  }

  // Triage: atomically sets `category`, `title`, `year`, `creator`, `description` and
  // `status = ORGANIZED` (docs/PROJECT.md), which removes the item from the Inbox result set.
  // Throws NotFoundError when `id` doesn't match any MediaItem.
  async triage(id: string, input: TriageItemInput) {
    const item = await this.itemsRepository.updateTriage(id, {
      category: input.category,
      title: input.title,
      year: input.year,
      creator: input.creator,
      description: input.description,
    });
    if (!item) {
      throw new NotFoundError(`MediaItem not found: ${id}`);
    }
    return item;
  }

  // Delete is permanent and immediate (docs/PROJECT.md). Throws NotFoundError when `id`
  // doesn't match any MediaItem.
  async remove(id: string) {
    const item = await this.itemsRepository.delete(id);
    if (!item) {
      throw new NotFoundError(`MediaItem not found: ${id}`);
    }
  }
}

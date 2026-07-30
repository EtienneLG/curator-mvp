import type { Logger } from '../lib/logger.js';
import { NotFoundError } from '../lib/errors.js';
import type { CaptureItemInput, ListItemsQuery, TriageItemInput } from '../schemas/item.schema.js';
import type { ItemsRepository } from '../repositories/items.repository.js';
import type { SuggestionsService } from './suggestions.service.js';

export class ItemsService {
  constructor(
    private readonly itemsRepository: ItemsRepository,
    private readonly suggestionsService: SuggestionsService,
  ) {}

  // Capture just persists raw content with status = INBOX; no link detection or metadata lookup.
  async capture(input: CaptureItemInput) {
    return this.itemsRepository.create({
      content: input.content,
      status: 'INBOX',
    });
  }

  async list(query: ListItemsQuery) {
    return this.itemsRepository.findByStatus(query.status);
  }

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

  // Throws NotFoundError when `id` doesn't match any MediaItem; the suggestion lookup itself
  // never throws (see SuggestionsService).
  async getSuggestions(id: string, logger: Logger) {
    const item = await this.itemsRepository.findById(id);
    if (!item) {
      throw new NotFoundError(`MediaItem not found: ${id}`);
    }
    return this.suggestionsService.suggest(item.content, logger);
  }

  // Throws NotFoundError when `id` doesn't match any MediaItem.
  async remove(id: string) {
    const item = await this.itemsRepository.delete(id);
    if (!item) {
      throw new NotFoundError(`MediaItem not found: ${id}`);
    }
  }
}

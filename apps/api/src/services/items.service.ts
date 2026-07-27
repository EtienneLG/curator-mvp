import type { CaptureItemInput } from '../schemas/item.schema.js';
import type { ItemsRepository } from '../repositories/items.repository.js';

// Server-authoritative link detection: only absolute http(s) URLs are treated as links —
// the client may detect links for instant UX, but the backend is the source of truth (PROJECT.md).
function isLink(content: string): boolean {
  try {
    const url = new URL(content);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export class ItemsService {
  constructor(private readonly itemsRepository: ItemsRepository) {}

  // Captures a new MediaItem. Title extraction (DEC-012) is deferred — `title` is always
  // `null` here. Newly captured items always start in the Inbox (`status: INBOX`).
  async capture(input: CaptureItemInput) {
    const content = input.content;
    const link = isLink(content);

    return this.itemsRepository.create({
      content,
      type: link ? 'LINK' : 'TEXT',
      url: link ? content : null,
      title: null,
      status: 'INBOX',
    });
  }
}

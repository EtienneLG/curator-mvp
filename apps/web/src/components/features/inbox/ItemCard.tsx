import type { ReactNode } from 'react';

import type { MediaItem } from '../../../types/media-item.types';
import { LinkCard } from './LinkCard';
import { TextCard } from './TextCard';

interface ItemCardProps {
  item: MediaItem;
  children?: ReactNode;
}

/**
 * Dispatches to the content variant matching `item.type` and wraps it in the
 * shared card frame. Triage/delete controls are composed in via `children`
 * (see AGENTS.md → Component Rules: composition over inheritance) so this
 * component stays decoupled from `CategorySelector`/`DeleteButton`.
 */
export function ItemCard({ item, children }: ItemCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {item.type === 'LINK' ? <LinkCard item={item} /> : <TextCard item={item} />}
      {children}
    </article>
  );
}

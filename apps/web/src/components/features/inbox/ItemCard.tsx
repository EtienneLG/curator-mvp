import type { MouseEventHandler, ReactNode } from 'react';

import { isUrlLike } from '../../../lib/utils';
import type { MediaItem } from '../../../types/media-item.types';

interface ItemCardProps {
  item: MediaItem;
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLElement>;
}

/**
 * Single uniform card for a `MediaItem` — there is no `TextCard`/`LinkCard`
 * split (docs/PROJECT.md, DEC-016). URL-shaped `content` is cosmetically
 * auto-linkified for display only; this is presentational, has no stored
 * field, and carries no business meaning. Refined `title` (once triaged)
 * takes display precedence over the raw `content`. Triage/delete controls
 * are composed in via `children` (see AGENTS.md → Component Rules:
 * composition over inheritance) so this component stays decoupled from
 * `DeleteButton`/`RefineMetadataModal`.
 */
export function ItemCard({ item, children, onClick }: ItemCardProps) {
  const displayText = item.title ?? item.content;

  return (
    <article
      onClick={onClick}
      className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      {isUrlLike(item.content) ? (
        <a
          href={item.content}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="break-words text-sm font-medium text-blue-600 underline-offset-2 hover:underline"
        >
          {displayText}
        </a>
      ) : (
        <p className="whitespace-pre-wrap break-words text-sm text-gray-900">{displayText}</p>
      )}
      {children}
    </article>
  );
}

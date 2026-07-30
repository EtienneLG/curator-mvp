import type { MouseEventHandler, ReactNode } from 'react';

import { CATEGORY_LABELS } from '../../../lib/constants';
import { isUrlLike } from '../../../lib/utils';
import type { MediaItem } from '../../../types/media-item.types';

interface ItemCardProps {
  item: MediaItem;
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLElement>;
}

/**
 * URL-shaped `content` is auto-linkified for display only — cosmetic, no stored field.
 * Refined `title` (once triaged) takes display precedence over the raw `content`.
 */
export function ItemCard({ item, children, onClick }: ItemCardProps) {
  const displayText = item.title ?? item.content;

  return (
    <article
      onClick={onClick}
      className="flex justify-between items-center rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        {item.category && (
          <span className="w-fit rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            {CATEGORY_LABELS[item.category]}
          </span>
        )}
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
      </div>
      {children}
    </article>
  );
}

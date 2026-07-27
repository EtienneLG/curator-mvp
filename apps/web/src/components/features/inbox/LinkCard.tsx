import type { MediaItem } from '../../../types/media-item.types';

interface LinkCardProps {
  item: MediaItem;
}

/**
 * Renders a captured link (`item.type === 'LINK'`). Displays the extracted
 * `title`, falling back to the raw URL when extraction failed — title text
 * only, no thumbnails/branding icons (docs/PROJECT.md → Out of Scope).
 */
export function LinkCard({ item }: LinkCardProps) {
  const displayText = item.title ?? item.url ?? item.content;

  return (
    <a
      href={item.url ?? item.content}
      target="_blank"
      rel="noreferrer"
      className="break-words text-sm font-medium text-blue-600 underline-offset-2 hover:underline"
    >
      {displayText}
    </a>
  );
}

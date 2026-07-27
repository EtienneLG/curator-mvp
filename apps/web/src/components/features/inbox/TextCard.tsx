import type { MediaItem } from '../../../types/media-item.types';

interface TextCardProps {
  item: MediaItem;
}

/**
 * Renders a free-text capture (`item.type === 'TEXT'`). Pure presentational
 * component — no data fetching or business logic (see AGENTS.md → #1 Rule).
 */
export function TextCard({ item }: TextCardProps) {
  return <p className="whitespace-pre-wrap break-words text-sm text-gray-900">{item.content}</p>;
}

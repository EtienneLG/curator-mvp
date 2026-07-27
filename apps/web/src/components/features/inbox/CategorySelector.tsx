import { CATEGORIES, CATEGORY_LABELS } from '../../../lib/constants';
import type { Category } from '../../../types/media-item.types';

interface CategorySelectorProps {
  onSelect: (category: Category) => void;
}

/**
 * Renders the four fixed triage buttons. Selecting a category is the atomic
 * triage action — it sets `category` + `status = ORGANIZED` in one call
 * (docs/PROJECT.md → Business Rules). Tap-friendly, ARIA-labeled per
 * AGENTS.md → Error Handling & Accessibility.
 */
export function CategorySelector({ onSelect }: CategorySelectorProps) {
  return (
    <div role="group" aria-label="Move to category" className="flex flex-wrap gap-2">
      {CATEGORIES.map((category) => (
        <button
          key={category}
          type="button"
          aria-label={`Move to ${CATEGORY_LABELS[category]}`}
          onClick={() => onSelect(category)}
          className="min-h-11 min-w-11 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 active:bg-gray-300"
        >
          {CATEGORY_LABELS[category]}
        </button>
      ))}
    </div>
  );
}

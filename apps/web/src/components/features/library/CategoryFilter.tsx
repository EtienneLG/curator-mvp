import type { ChangeEvent } from 'react';

import { CATEGORIES, CATEGORY_LABELS } from '../../../lib/constants';
import { useUIStore } from '../../../stores/ui.store';
import type { LibraryCategoryFilter } from '../../../stores/ui.store';

/** Native `<select>` bound to the Zustand-owned Library category filter. */
export function CategoryFilter() {
  const libraryCategoryFilter = useUIStore((state) => state.libraryCategoryFilter);
  const setLibraryCategoryFilter = useUIStore((state) => state.setLibraryCategoryFilter);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setLibraryCategoryFilter(event.target.value as LibraryCategoryFilter);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="library-category-filter" className="text-sm font-medium text-gray-700">
        Category
      </label>
      <select
        id="library-category-filter"
        value={libraryCategoryFilter}
        onChange={handleChange}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="ALL">All</option>
        {CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {CATEGORY_LABELS[category]}
          </option>
        ))}
      </select>
    </div>
  );
}

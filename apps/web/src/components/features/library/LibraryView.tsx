import { useLibraryItems } from '../../../hooks/useLibraryItems';
import { ItemCard } from '../inbox/ItemCard';

/**
 * Library screen: lists organized items newest-first, read-only. Category
 * filtering is explicitly deferred (docs/PROJECT.md → Sorted Library) — no
 * triage/delete controls here, unlike `InboxView`. All data fetching lives
 * in the `useLibraryItems` hook — this component only renders (see AGENTS.md
 * → #1 Rule).
 */
export function LibraryView() {
  const { data: items, isLoading, error } = useLibraryItems();

  if (isLoading) {
    return (
      <p role="status" className="p-4 text-center text-sm text-gray-500">
        Loading library…
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert" className="p-4 text-center text-sm text-red-600">
        Couldn&apos;t load the library. Please try again.
      </p>
    );
  }

  if (!items || items.length === 0) {
    return (
      <p className="p-4 text-center text-sm text-gray-500">
        Your library is empty. Organize items from the Inbox to see them here.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3 p-4">
      {items.map((item) => (
        <li key={item.id}>
          <ItemCard item={item} />
        </li>
      ))}
    </ul>
  );
}

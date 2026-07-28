import { useVaultItems } from '../../../hooks/useVaultItems';
import { ItemCard } from '../inbox/ItemCard';

/**
 * Vault screen: lists organized items newest-first, read-only. Category
 * filtering is explicitly deferred (docs/PROJECT.md → Sorted Vault) — no
 * triage/delete controls here, unlike `InboxView`. All data fetching lives
 * in the `useVaultItems` hook — this component only renders (see AGENTS.md
 * → #1 Rule).
 */
export function VaultView() {
  const { data: items, isLoading, error } = useVaultItems();

  if (isLoading) {
    return (
      <p role="status" className="p-4 text-center text-sm text-gray-500">
        Loading vault…
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert" className="p-4 text-center text-sm text-red-600">
        Couldn&apos;t load the vault. Please try again.
      </p>
    );
  }

  if (!items || items.length === 0) {
    return (
      <p className="p-4 text-center text-sm text-gray-500">
        Your vault is empty. Organize items from the Inbox to see them here.
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

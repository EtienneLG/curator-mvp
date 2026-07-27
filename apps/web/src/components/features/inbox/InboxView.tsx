import { useDeleteItem } from '../../../hooks/useDeleteItem';
import { useInboxItems } from '../../../hooks/useInboxItems';
import { useTriageItem } from '../../../hooks/useTriageItem';
import { CategorySelector } from './CategorySelector';
import { DeleteButton } from './DeleteButton';
import { ItemCard } from './ItemCard';

/**
 * Inbox screen: lists unorganized items newest-first with per-card triage
 * and delete controls. All data fetching/mutation logic lives in the
 * `useInboxItems`/`useTriageItem`/`useDeleteItem` hooks — this component only
 * renders (see AGENTS.md → #1 Rule).
 */
export function InboxView() {
  const { data: items, isLoading, error } = useInboxItems();
  const { triage } = useTriageItem();
  const { deleteItem } = useDeleteItem();

  if (isLoading) {
    return (
      <p role="status" className="p-4 text-center text-sm text-gray-500">
        Loading inbox…
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert" className="p-4 text-center text-sm text-red-600">
        Couldn&apos;t load the inbox. Please try again.
      </p>
    );
  }

  if (!items || items.length === 0) {
    return (
      <p className="p-4 text-center text-sm text-gray-500">
        Your inbox is empty. Capture something to get started.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3 p-4">
      {items.map((item) => (
        <li key={item.id}>
          <ItemCard item={item}>
            <div className="flex items-center justify-between gap-2">
              <CategorySelector onSelect={(category) => triage({ id: item.id, category })} />
              <DeleteButton onDelete={() => deleteItem(item.id)} />
            </div>
          </ItemCard>
        </li>
      ))}
    </ul>
  );
}

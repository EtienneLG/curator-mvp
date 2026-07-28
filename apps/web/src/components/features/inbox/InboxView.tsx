import { useState } from 'react';

import { useDeleteItem } from '../../../hooks/useDeleteItem';
import { useInboxItems } from '../../../hooks/useInboxItems';
import { useTriageItem } from '../../../hooks/useTriageItem';
import type { TriageItemInput } from '../../../services/item.service';
import { DeleteButton } from './DeleteButton';
import { ItemCard } from './ItemCard';
import { RefineMetadataModal } from './RefineMetadataModal';

/**
 * Inbox screen: lists unorganized items newest-first. Tapping a card opens
 * the Refine & Triage Modal (docs/PROJECT.md → Core Features); Delete stays
 * a separate, inline card action, independent of the modal (docs/PROJECT.md
 * → Business Rules). All data fetching/mutation logic lives in the
 * `useInboxItems`/`useTriageItem`/`useDeleteItem` hooks — this component only
 * renders + local UI state (which card's modal is open) (see AGENTS.md → #1 Rule).
 */
export function InboxView() {
  const { data: items, isLoading, error } = useInboxItems();
  const { triage } = useTriageItem();
  const { deleteItem } = useDeleteItem();
  const [refiningItemId, setRefiningItemId] = useState<string | null>(null);

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

  const refiningItem = items.find((item) => item.id === refiningItemId) ?? null;

  const handleValidate = (id: string, input: TriageItemInput) => {
    triage({ id, input });
    setRefiningItemId(null);
  };

  return (
    <>
      <ul className="flex flex-col gap-3 p-4">
        {items.map((item) => (
          <li key={item.id}>
            <ItemCard item={item} onClick={() => setRefiningItemId(item.id)}>
              <div
                onClick={(event) => event.stopPropagation()}
                className="flex items-center justify-end gap-2"
              >
                <DeleteButton onDelete={() => deleteItem(item.id)} />
              </div>
            </ItemCard>
          </li>
        ))}
      </ul>

      {refiningItem && (
        <RefineMetadataModal
          item={refiningItem}
          onValidate={(input) => handleValidate(refiningItem.id, input)}
          onClose={() => setRefiningItemId(null)}
        />
      )}
    </>
  );
}

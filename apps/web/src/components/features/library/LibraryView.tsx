import { useState } from 'react';

import { useDeleteItem } from '../../../hooks/useDeleteItem';
import { useLibraryItems } from '../../../hooks/useLibraryItems';
import { ItemCard } from '../inbox/ItemCard';
import { ItemDetailModal } from './ItemDetailModal';

/** No inline triage/delete controls on the card itself — those live in the detail modal. */
export function LibraryView() {
  const { data: items, isLoading, error } = useLibraryItems();
  const { deleteItem } = useDeleteItem();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

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

  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;

  const handleDelete = (id: string) => {
    deleteItem(id);
    setSelectedItemId(null);
  };

  return (
    <>
      <ul className="flex flex-col gap-3 p-4">
        {items.map((item) => (
          <li key={item.id}>
            <ItemCard item={item} onClick={() => setSelectedItemId(item.id)} />
          </li>
        ))}
      </ul>

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onDelete={() => handleDelete(selectedItem.id)}
          onClose={() => setSelectedItemId(null)}
        />
      )}
    </>
  );
}

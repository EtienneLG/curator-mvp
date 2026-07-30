import { CATEGORY_LABELS } from '../../../lib/constants';
import type { MediaItem } from '../../../types/media-item.types';
import { DeleteButton } from '../inbox/DeleteButton';

interface ItemDetailModalProps {
  item: MediaItem;
  onDelete: () => void;
  onClose: () => void;
}

/** Read-only counterpart to `RefineMetadataModal` — no editing, just full metadata + delete. */
export function ItemDetailModal({ item, onDelete, onClose }: ItemDetailModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Item details"
      className="fixed inset-0 z-10 flex items-end justify-center bg-black/40 sm:items-center"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-lg bg-white p-4 shadow-lg sm:rounded-lg">
        <div className="flex flex-col gap-4">
          {item.category && (
            <span className="w-fit rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              {CATEGORY_LABELS[item.category]}
            </span>
          )}

          <h2 className="whitespace-pre-wrap break-words text-lg font-semibold text-gray-900">
            {item.title ?? item.content}
          </h2>

          {item.creator && <p className="text-sm text-gray-700">{item.creator}</p>}

          {item.year != null && <p className="text-sm text-gray-500">{item.year}</p>}

          {item.description && (
            <p className="whitespace-pre-wrap break-words text-sm text-gray-700">
              {item.description}
            </p>
          )}

          <p className="whitespace-pre-wrap break-words border-t border-gray-100 pt-4 text-xs text-gray-500">
            {item.content}
          </p>

          <div className="flex items-center justify-between gap-2 pt-2">
            <DeleteButton onDelete={onDelete} />
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

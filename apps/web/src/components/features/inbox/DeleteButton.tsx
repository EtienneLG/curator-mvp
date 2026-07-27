interface DeleteButtonProps {
  onDelete: () => void;
}

/**
 * Permanently deletes the item — single action, no confirm modal, no
 * soft-delete (docs/PROJECT.md -> Business Rules). Icon-only, so it must
 * carry an aria-label (see AGENTS.md -> Error Handling & Accessibility).
 */
export function DeleteButton({ onDelete }: DeleteButtonProps) {
  return (
    <button
      type="button"
      aria-label="Delete item"
      onClick={onDelete}
      className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-gray-500 hover:bg-red-50 hover:text-red-600 active:bg-red-100"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 7h12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7h12Z"
        />
      </svg>
    </button>
  );
}

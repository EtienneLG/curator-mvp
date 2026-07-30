import { CATEGORY_LABELS } from '../../../lib/constants';
import type { Suggestion } from '../../../types/suggestion.types';

interface SuggestionPanelProps {
  suggestion: Suggestion;
  onApply: (suggestion: Suggestion) => void;
}

// Read-only preview of a best-effort refine-time suggestion (DEC-016), with a single action
// to apply it onto the refine form. Only fields the lookup actually resolved are shown.
export function SuggestionPanel({ suggestion, onApply }: SuggestionPanelProps) {
  return (
    <div className="mb-4 flex flex-col gap-2 rounded-md border border-blue-200 bg-blue-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Suggestion</p>
      <dl className="flex flex-col gap-1 text-sm text-gray-700">
        {suggestion.category != null && (
          <div className="flex gap-1">
            <dt className="font-medium">Category:</dt>
            <dd>{CATEGORY_LABELS[suggestion.category]}</dd>
          </div>
        )}
        {suggestion.title != null && (
          <div className="flex gap-1">
            <dt className="font-medium">Title:</dt>
            <dd>{suggestion.title}</dd>
          </div>
        )}
        {suggestion.year != null && (
          <div className="flex gap-1">
            <dt className="font-medium">Year:</dt>
            <dd>{suggestion.year}</dd>
          </div>
        )}
        {suggestion.creator != null && (
          <div className="flex gap-1">
            <dt className="font-medium">Creator:</dt>
            <dd>{suggestion.creator}</dd>
          </div>
        )}
        {suggestion.description != null && (
          <div className="flex gap-1">
            <dt className="font-medium">Description:</dt>
            <dd>{suggestion.description}</dd>
          </div>
        )}
      </dl>
      <button
        type="button"
        onClick={() => onApply(suggestion)}
        className="self-center rounded-md bg-blue-600 px-4 py-1 text-xs font-medium text-white hover:bg-blue-700"
      >
        Apply
      </button>
    </div>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useSuggestion } from '../../../hooks/useSuggestion';
import { CATEGORIES, CATEGORY_LABELS } from '../../../lib/constants';
import { CategorySchema, type MediaItem } from '../../../types/media-item.types';
import { hasSuggestedData, type Suggestion } from '../../../types/suggestion.types';
import type { TriageItemInput } from '../../../services/item.service';
import { SuggestionPanel } from './SuggestionPanel';

interface RefineMetadataModalProps {
  item: MediaItem;
  onValidate: (input: TriageItemInput) => void;
  onClose: () => void;
}

// Validating commits all fields + `status = ORGANIZED` in one atomic triage action.
const RefineFormSchema = z.object({
  category: CategorySchema,
  title: z.string().trim().min(1, 'Title is required'),
  year: z.string().trim(),
  creator: z.string().trim(),
  description: z.string().trim(),
});

type RefineFormValues = z.infer<typeof RefineFormSchema>;

export function RefineMetadataModal({ item, onValidate, onClose }: RefineMetadataModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RefineFormValues>({
    resolver: zodResolver(RefineFormSchema),
    defaultValues: {
      category: item.category ?? CATEGORIES[0],
      title: item.title ?? '',
      year: item.year != null ? String(item.year) : '',
      creator: item.creator ?? '',
      description: item.description ?? '',
    },
  });

  // Fetches automatically as soon as the modal mounts (DEC-016) — best-effort, never
  // blocks the form: a loading/empty/failed suggestion just means no panel is shown.
  const { data: suggestion, isLoading: isSuggestionLoading } = useSuggestion(item.id);

  const onSubmit = handleSubmit((values) => {
    const parsedYear = values.year === '' ? null : Number(values.year);
    onValidate({
      category: values.category,
      title: values.title,
      year: Number.isNaN(parsedYear) ? null : parsedYear,
      creator: values.creator === '' ? null : values.creator,
      description: values.description === '' ? null : values.description,
    });
  });

  // Only fills fields the suggestion actually resolved — anything the user already typed
  // (or a field the lookup couldn't determine) is left untouched.
  const handleApplySuggestion = (applied: Suggestion) => {
    if (applied.category != null) {
      setValue('category', applied.category, { shouldValidate: true });
    }
    if (applied.title != null) {
      setValue('title', applied.title, { shouldValidate: true });
    }
    if (applied.year != null) {
      setValue('year', String(applied.year), { shouldValidate: true });
    }
    if (applied.creator != null) {
      setValue('creator', applied.creator, { shouldValidate: true });
    }
    if (applied.description != null) {
      setValue('description', applied.description, { shouldValidate: true });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Refine metadata"
      className="fixed inset-0 z-10 flex items-end justify-center bg-black/40 sm:items-center"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-lg bg-white p-4 shadow-lg sm:rounded-lg">
        <p className="mb-4 whitespace-pre-wrap break-words text-sm text-gray-500">
          {item.content}
        </p>

        {isSuggestionLoading && (
          <p role="status" className="mb-4 text-sm text-gray-500">
            Looking for a suggestion…
          </p>
        )}

        {suggestion && hasSuggestedData(suggestion) && (
          <SuggestionPanel suggestion={suggestion} onApply={handleApplySuggestion} />
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="category" className="text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category"
              {...register('category')}
              className="min-h-11 rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="title" className="text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              className="min-h-11 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            {errors.title && (
              <p role="alert" className="text-xs text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="year" className="text-sm font-medium text-gray-700">
              Year
            </label>
            <input
              id="year"
              type="number"
              inputMode="numeric"
              {...register('year')}
              className="min-h-11 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="creator" className="text-sm font-medium text-gray-700">
              Creator
            </label>
            <input
              id="creator"
              type="text"
              {...register('creator')}
              className="min-h-11 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              {...register('description')}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-11 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Validate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

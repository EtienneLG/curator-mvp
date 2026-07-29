import { useState, type FormEvent } from 'react';

import { useCaptureItem } from '../../../hooks/useCaptureItem';
import { CaptureInputSchema } from '../../../types/media-item.types';

/** Deliberately a simple controlled input, not React Hook Form — capture is a single free-form field. */
export function CaptureBar() {
  const [content, setContent] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { capture, isLoading } = useCaptureItem();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = CaptureInputSchema.safeParse({ content });
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message ?? 'Enter something to capture');
      return;
    }

    setValidationError(null);
    capture(result.data, {
      onSuccess: () => setContent(''),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <label htmlFor="capture-input" className="sr-only">
          Capture a note or link
        </label>
        <input
          id="capture-input"
          type="text"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Capture a note or link…"
          className="min-h-11 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="min-h-11 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {validationError && (
        <p role="alert" className="text-xs text-red-600">
          {validationError}
        </p>
      )}
    </form>
  );
}

import { LibraryView } from '../components/features/library/LibraryView';

/**
 * Library page — the secondary screen listing organized items. Thin wrapper:
 * all data fetching logic lives in `LibraryView`'s hooks (see AGENTS.md → #1
 * Rule). Route-level error handling is wired via the router's
 * `errorElement`.
 */
export function LibraryPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <LibraryView />
    </main>
  );
}

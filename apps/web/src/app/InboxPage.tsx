import { CaptureBar } from '../components/features/capture/CaptureBar';
import { InboxView } from '../components/features/inbox/InboxView';

/**
 * Inbox page — the default screen listing unorganized items, with the
 * All-Capture Bar pinned to the top (docs/PROJECT.md → Core Features).
 * Thin wrapper: all data fetching/mutation logic lives in `CaptureBar`'s and
 * `InboxView`'s hooks (see AGENTS.md → #1 Rule). Route-level error handling
 * is wired via the router's `errorElement` (see AGENTS.md → Routing Strategy).
 */
export function InboxPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <CaptureBar />
      <InboxView />
    </main>
  );
}

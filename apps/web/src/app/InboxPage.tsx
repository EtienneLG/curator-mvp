import { CaptureBar } from '../components/features/capture/CaptureBar';
import { InboxView } from '../components/features/inbox/InboxView';

export function InboxPage() {
  return (
    <main className="min-h-full bg-gray-50">
      <CaptureBar />
      <InboxView />
    </main>
  );
}

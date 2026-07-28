import { VaultView } from '../components/features/vault/VaultView';

/**
 * Vault page — the secondary screen listing organized items. Thin wrapper:
 * all data fetching logic lives in `VaultView`'s hooks (see AGENTS.md → #1
 * Rule). Route-level error handling is wired via the router's
 * `errorElement`.
 */
export function VaultPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <VaultView />
    </main>
  );
}

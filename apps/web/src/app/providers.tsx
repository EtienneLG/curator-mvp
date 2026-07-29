import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient();

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * App-wide providers (TanStack Query, toast notifications, etc.). Keep this
 * the single place providers are composed — do not scatter provider
 * wrapping across pages. `<Toaster />` is mounted once here so any hook can
 * call `toast.error(...)` on action failure (see AGENTS.md → Error Handling).
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}

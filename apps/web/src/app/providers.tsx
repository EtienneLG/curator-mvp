import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * App-wide providers (TanStack Query, etc.). Keep this the single place
 * providers are composed — do not scatter provider wrapping across pages.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

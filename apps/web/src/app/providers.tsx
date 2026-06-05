'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 10 minute polling for live market data
            refetchInterval: 600_000,
            // Keep data fresh for 5 minutes
            staleTime: 300_000,
            // Don't refetch on window focus for financial data (prevent rate spikes)
            refetchOnWindowFocus: false,
            // Retry failed requests with exponential backoff
            retry: 3,
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30_000),
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

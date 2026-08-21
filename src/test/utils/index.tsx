import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import { MoneyVisibilityProvider } from "@/shared/ui-components/data/MoneyVisibility";

/**
 * Renders with a throwaway QueryClient per test — retries off so a failing
 * query surfaces immediately instead of after backoff.
 *
 * Money is revealed, so assertions can name real amounts. The app defaults to
 * masked; `setupTest.ts` stores the revealed preference, which the provider
 * picks up. A test that needs the masked default clears that key first.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
): RenderResult {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MoneyVisibilityProvider>{children}</MoneyVisibilityProvider>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

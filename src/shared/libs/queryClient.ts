import { QueryClient, type QueryKey } from "@tanstack/react-query";

/**
 * A page opened by UUID redirects to its serial URL, which changes the detail
 * key. Caching the loaded entity under the serial key too lets the redirected
 * page render from cache instead of dropping to a skeleton and refetching.
 */
export function cacheUnderSerialKey<T>(
  client: QueryClient,
  ref: string,
  serialNumber: number | undefined,
  keyFor: (ref: string) => QueryKey,
  data: T,
): void {
  if (serialNumber === undefined || String(serialNumber) === ref) return;
  client.setQueryData(keyFor(String(serialNumber)), data);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

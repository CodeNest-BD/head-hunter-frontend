import { useMutation } from "@tanstack/react-query";

import { downloadFile } from "@/shared/utils/downloadFile";

/** `payments-last-30-days-2026-10-13.csv`, matching the API's own name. */
function csvFileName(board: string, withinDays: number | undefined): string {
  const range = withinDays ? `last-${withinDays}-days` : "all-time";
  const today = new Date().toISOString().slice(0, 10);
  return `${board}-${range}-${today}.csv`;
}

/**
 * Exports a finance board under its current filters. A mutation rather than a
 * query: it is a one-off action the admin triggers, not data to cache, and it
 * gives the button its pending state.
 */
export function useCsvExport<Params extends { withinDays?: number }>(
  board: "payments" | "payouts",
  fetchCsv: (params: Params) => Promise<Blob>,
) {
  return useMutation({
    mutationFn: fetchCsv,
    onSuccess: (blob, params) =>
      downloadFile(blob, csvFileName(board, params.withinDays)),
  });
}

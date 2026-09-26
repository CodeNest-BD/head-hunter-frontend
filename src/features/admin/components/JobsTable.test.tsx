import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import type { AdminJobListItem } from "../schemas";
import { JobsTable } from "./JobsTable";

const bulkRepostMutate = vi.fn();
const bulkDeleteMutate = vi.fn();

function job(overrides: Partial<AdminJobListItem>): AdminJobListItem {
  return {
    jobId: "job-1",
    title: "Pharmacy Technician",
    companyProfileId: "cp-1",
    companyUserId: "cu-1",
    companyName: "Huber Mcdonald Traders",
    hasLogo: false,
    status: "expired",
    recruiterFeeMinor: 200_000,
    locationState: "TX",
    candidateCount: 0,
    createdAt: "2026-08-27T00:00:00.000Z",
    ...overrides,
  };
}

const JOBS = [
  job({ jobId: "job-1", title: "Pharmacy Technician" }),
  job({ jobId: "job-2", title: "Store Manager", status: "published" }),
];

vi.mock("../hooks/useAdmin", () => ({
  useAdminJobs: () => ({
    data: {
      data: JOBS,
      meta: { total: 2, totalPages: 1, page: 1, limit: 25 },
    },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useAdminStats: () => ({ data: undefined }),
  useMinRecruiterFeeSetting: () => ({ data: { amountMinor: 0 } }),
  useBulkRepostAdminJobs: () => ({
    mutate: bulkRepostMutate,
    isPending: false,
  }),
  useBulkDeleteAdminJobs: () => ({
    mutate: bulkDeleteMutate,
    isPending: false,
  }),
  useDeleteAdminJob: () => ({ mutate: vi.fn(), isPending: false }),
  useRepostAdminJob: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("JobsTable bulk selection", () => {
  beforeEach(() => {
    bulkRepostMutate.mockReset();
    bulkDeleteMutate.mockReset();
  });

  it("select-all → confirm → bulk delete fires with every visible id, then clears", async () => {
    const user = userEvent.setup();
    bulkDeleteMutate.mockImplementation((ids: string[], opts) =>
      opts.onSuccess({ succeeded: ids.length, failed: [] }),
    );
    renderWithProviders(<JobsTable />);

    await user.click(
      screen.getByRole("checkbox", { name: "Select all jobs on this page" }),
    );
    expect(screen.getByText("2 selected")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    // Nothing fires until the modal confirms.
    expect(bulkDeleteMutate).not.toHaveBeenCalled();
    expect(screen.getByText("Delete 2 selected jobs?")).toBeInTheDocument();

    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Delete",
      }),
    );

    expect(bulkDeleteMutate).toHaveBeenCalledWith(
      ["job-1", "job-2"],
      expect.anything(),
    );
    // Full success clears the selection bar.
    expect(screen.queryByText("2 selected")).not.toBeInTheDocument();
  });

  it("keeps only the skipped jobs selected after a partial bulk re-post", async () => {
    const user = userEvent.setup();
    bulkRepostMutate.mockImplementation((_ids: string[], opts) =>
      opts.onSuccess({
        succeeded: 1,
        failed: [
          { jobId: "job-2", reason: "Only an expired job can be re-posted" },
        ],
      }),
    );
    renderWithProviders(<JobsTable />);

    await user.click(
      screen.getByRole("checkbox", { name: "Select all jobs on this page" }),
    );
    await user.click(screen.getByRole("button", { name: "Re-post" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Re-post",
      }),
    );

    expect(bulkRepostMutate).toHaveBeenCalledWith(
      ["job-1", "job-2"],
      expect.anything(),
    );
    // The failed row stays selected so the admin can see and retry it.
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Select Store Manager" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Select Pharmacy Technician" }),
    ).not.toBeChecked();
  });
});

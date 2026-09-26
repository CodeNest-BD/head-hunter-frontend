import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import { JobRowActions } from "./JobRowActions";

const deleteMutate = vi.fn();
const repostMutate = vi.fn();

vi.mock("../hooks/useAdmin", () => ({
  useDeleteAdminJob: () => ({ mutate: deleteMutate, isPending: false }),
  useRepostAdminJob: () => ({ mutate: repostMutate, isPending: false }),
}));

describe("JobRowActions", () => {
  beforeEach(() => {
    deleteMutate.mockReset();
    repostMutate.mockReset();
  });

  const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(
      screen.getByRole("button", { name: "Actions for Pharmacy Technician" }),
    );
  };

  it("offers Re-post only for expired jobs", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <JobRowActions
        jobId="job-1"
        jobTitle="Pharmacy Technician"
        status="published"
      />,
    );

    await openMenu(user);

    expect(screen.getByText("Edit job")).toBeInTheDocument();
    expect(screen.getByText("Delete job")).toBeInTheDocument();
    expect(screen.queryByText("Re-post job")).not.toBeInTheDocument();
  });

  it("re-posts an expired job only after confirmation", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <JobRowActions
        jobId="job-1"
        jobTitle="Pharmacy Technician"
        status="expired"
      />,
    );

    await openMenu(user);
    await user.click(screen.getByText("Re-post job"));
    // Nothing fires until the modal's confirm.
    expect(repostMutate).not.toHaveBeenCalled();
    expect(screen.getByText("Re-post this job?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Re-post job" }));

    expect(repostMutate).toHaveBeenCalledWith(
      "job-1",
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("deletes only after confirmation", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <JobRowActions
        jobId="job-1"
        jobTitle="Pharmacy Technician"
        status="expired"
      />,
    );

    await openMenu(user);
    await user.click(screen.getByText("Delete job"));
    expect(deleteMutate).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Delete job" }));

    expect(deleteMutate).toHaveBeenCalledWith(
      "job-1",
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });
});

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import type { Submission } from "../schemas";
import { SubmissionHeader } from "./SubmissionHeader";

const mutateMock = vi.fn();
const useUpdateSubmissionStatusMock = vi.fn();

vi.mock("../hooks/useSubmissions", () => ({
  useUpdateSubmissionStatus: (...args: unknown[]) =>
    useUpdateSubmissionStatusMock(...args),
}));

const submission: Submission = {
  id: "submission-1",
  jobId: "job-1",
  recruiterProfileId: "recruiter-1",
  recruiter: null,
  status: "submitted",
  note: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

describe("SubmissionHeader", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    useUpdateSubmissionStatusMock.mockReset();
    useUpdateSubmissionStatusMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    });
  });

  it("asks for confirmation before withdrawing", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SubmissionHeader submission={submission} jobTitle="Senior Engineer" />,
    );

    await user.click(screen.getByRole("button", { name: /^withdraw$/i }));
    expect(mutateMock).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: /confirm withdraw/i }),
    );
    expect(mutateMock).toHaveBeenCalledWith("withdrawn");
  });

  it("hides the withdraw action when the submission is already withdrawn", () => {
    renderWithProviders(
      <SubmissionHeader
        submission={{ ...submission, status: "withdrawn" }}
        jobTitle="Senior Engineer"
      />,
    );

    expect(
      screen.queryByRole("button", { name: /withdraw/i }),
    ).not.toBeInTheDocument();
  });
});

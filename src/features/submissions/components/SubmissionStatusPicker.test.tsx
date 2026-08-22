import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import type { Submission, SubmissionStatus } from "../schemas";
import { SubmissionStatusPicker } from "./SubmissionStatusPicker";

const mutateMock = vi.fn();
const useUpdateSubmissionStatusMock = vi.fn();

vi.mock("../hooks/useSubmissions", () => ({
  useUpdateSubmissionStatus: (...args: unknown[]) =>
    useUpdateSubmissionStatusMock(...args),
}));

const submissionWith = (status: SubmissionStatus): Submission => ({
  id: "submission-1",
  jobId: "job-1",
  recruiterProfileId: "recruiter-1",
  recruiter: null,
  status,
  note: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
});

const picker = (): HTMLSelectElement =>
  screen.getByRole("combobox", { name: /submission status/i });

describe("SubmissionStatusPicker", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    useUpdateSubmissionStatusMock.mockReset();
    useUpdateSubmissionStatusMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    });
  });

  it("offers only the statuses that change something", () => {
    renderWithProviders(
      <SubmissionStatusPicker submission={submissionWith("submitted")} />,
    );

    expect([...picker().options].map((option) => option.value)).toEqual([
      "submitted",
      "rejected",
    ]);
  });

  it("offers neither of the statuses that gate nothing", () => {
    renderWithProviders(
      <SubmissionStatusPicker submission={submissionWith("submitted")} />,
    );

    const offered = [...picker().options].map((option) => option.value);
    expect(offered).not.toContain("under_review");
    expect(offered).not.toContain("advanced");
  });

  it("reports a stored status it cannot set, rather than misreporting it", () => {
    renderWithProviders(
      <SubmissionStatusPicker submission={submissionWith("under_review")} />,
    );

    expect(picker()).toHaveDisplayValue("Under review");
    expect(picker()).toBeEnabled();
  });

  it("sends the chosen status", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SubmissionStatusPicker submission={submissionWith("submitted")} />,
    );

    await user.selectOptions(picker(), "rejected");

    expect(mutateMock).toHaveBeenCalledWith("rejected");
  });

  it("cannot reopen a submission the recruiter withdrew", () => {
    renderWithProviders(
      <SubmissionStatusPicker submission={submissionWith("withdrawn")} />,
    );

    expect(picker()).toBeDisabled();
    expect(picker()).toHaveDisplayValue("Withdrawn");
  });
});

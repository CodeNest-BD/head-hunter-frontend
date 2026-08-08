import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import type { Candidate } from "../schemas";
import { MAX_CV_BYTES } from "../schemas";
import { CandidateForm } from "./CandidateForm";

const fetchCandidatesMock = vi.fn();
const fetchAttachmentsMock = vi.fn();
const updateCandidateStatusMock = vi.fn();
const presignSubmissionUploadMock = vi.fn();
const uploadToPresignedUrlMock = vi.fn();
const createCandidateMock = vi.fn();
const updateCandidateMock = vi.fn();
const deleteCandidateMock = vi.fn();

vi.mock("../api/candidates", () => ({
  fetchCandidates: (...args: unknown[]) => fetchCandidatesMock(...args),
  fetchAttachments: (...args: unknown[]) => fetchAttachmentsMock(...args),
  updateCandidateStatus: (...args: unknown[]) =>
    updateCandidateStatusMock(...args),
  presignSubmissionUpload: (...args: unknown[]) =>
    presignSubmissionUploadMock(...args),
  uploadToPresignedUrl: (...args: unknown[]) =>
    uploadToPresignedUrlMock(...args),
  createCandidate: (...args: unknown[]) => createCandidateMock(...args),
  updateCandidate: (...args: unknown[]) => updateCandidateMock(...args),
  deleteCandidate: (...args: unknown[]) => deleteCandidateMock(...args),
}));

const candidate: Candidate = {
  id: "candidate-1",
  submissionId: "submission-1",
  fullName: "Jane Doe",
  email: "jane@example.com",
  phone: "555-1234",
  overview: "Strong backend candidate.",
  linkedinUrl: "https://linkedin.com/in/janedoe",
  yearsOfExperience: 5,
  currentCompany: "Acme Corp",
  expectedSalaryMinor: 150000,
  noticePeriodDays: 14,
  status: "submitted",
  createdAt: new Date("2026-01-01"),
};

function pdfFile(): File {
  return new File(["x"], "cv.pdf", { type: "application/pdf" });
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Full name"), "Jane Doe");
  await user.type(screen.getByLabelText("Email"), "jane@example.com");
}

describe("CandidateForm", () => {
  beforeEach(() => {
    fetchCandidatesMock.mockReset();
    fetchAttachmentsMock.mockReset();
    updateCandidateStatusMock.mockReset();
    presignSubmissionUploadMock.mockReset();
    uploadToPresignedUrlMock.mockReset();
    createCandidateMock.mockReset();
    updateCandidateMock.mockReset();
    deleteCandidateMock.mockReset();
  });

  it("keeps submit disabled until a valid CV file is chosen", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CandidateForm submissionId="submission-1" onDone={vi.fn()} />,
    );

    const submitButton = screen.getByRole("button", {
      name: /submit candidate/i,
    });
    expect(submitButton).toBeDisabled();

    await user.upload(screen.getByLabelText(/cv \/ resume/i), pdfFile());

    expect(submitButton).not.toBeDisabled();
  });

  it("rejects a .png file with a type message", async () => {
    // A real browser's file picker won't offer non-matching files at all;
    // userEvent mirrors that by filtering uploads against `accept`, so this
    // scenario — a file that slips through some other route — needs it off.
    const user = userEvent.setup({ applyAccept: false });
    renderWithProviders(
      <CandidateForm submissionId="submission-1" onDone={vi.fn()} />,
    );

    const pngFile = new File(["x"], "cv.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(/cv \/ resume/i), pngFile);

    expect(screen.getByText(/pdf or word document/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /submit candidate/i }),
    ).toBeDisabled();
  });

  it("rejects an oversized file with a size message", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CandidateForm submissionId="submission-1" onDone={vi.fn()} />,
    );

    const oversized = pdfFile();
    Object.defineProperty(oversized, "size", {
      value: MAX_CV_BYTES + 1,
      configurable: true,
    });
    await user.upload(screen.getByLabelText(/cv \/ resume/i), oversized);

    expect(screen.getByText(/mb or smaller/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /submit candidate/i }),
    ).toBeDisabled();
  });

  it("converts the dollars input to cents in the mutation payload", async () => {
    const user = userEvent.setup();
    presignSubmissionUploadMock.mockResolvedValue({
      s3Key: "staged/key.pdf",
      uploadUrl: "https://s3.example.com/upload",
    });
    uploadToPresignedUrlMock.mockResolvedValue(undefined);
    createCandidateMock.mockResolvedValue(candidate);
    const onDone = vi.fn();

    renderWithProviders(
      <CandidateForm submissionId="submission-1" onDone={onDone} />,
    );

    await fillRequiredFields(user);
    await user.type(screen.getByLabelText(/expected salary/i), "1500");
    await user.upload(screen.getByLabelText(/cv \/ resume/i), pdfFile());

    await user.click(screen.getByRole("button", { name: /submit candidate/i }));

    await waitFor(() => expect(createCandidateMock).toHaveBeenCalled());
    expect(createCandidateMock.mock.calls[0]?.[1]).toMatchObject({
      expectedSalaryMinor: 150000,
    });
  });

  it("edit mode hides the CV input and prefills fields", () => {
    renderWithProviders(
      <CandidateForm
        submissionId="submission-1"
        candidate={candidate}
        onDone={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText(/cv \/ resume/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Full name")).toHaveValue("Jane Doe");
    expect(screen.getByLabelText("Email")).toHaveValue("jane@example.com");
    expect(screen.getByLabelText(/expected salary/i)).toHaveValue("1500");
  });
});

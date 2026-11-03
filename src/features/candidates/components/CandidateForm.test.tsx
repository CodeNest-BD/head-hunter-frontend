import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import { MAX_DOCUMENT_BYTES } from "@/shared/libs/documentUpload";
import type { Candidate } from "../schemas";
import { CandidateForm } from "./CandidateForm";

const fetchCandidatesMock = vi.fn();
const fetchAttachmentsMock = vi.fn();
const presignCandidateUploadMock = vi.fn();
const uploadToPresignedUrlMock = vi.fn();
const createCandidateMock = vi.fn();
const updateCandidateMock = vi.fn();
const deleteCandidateMock = vi.fn();

vi.mock("../api/candidates", () => ({
  fetchMyCandidatesForJob: (...args: unknown[]) => fetchCandidatesMock(...args),
  fetchCandidate: (...args: unknown[]) => fetchCandidatesMock(...args),
  fetchAttachments: (...args: unknown[]) => fetchAttachmentsMock(...args),
  presignCandidateUpload: (...args: unknown[]) =>
    presignCandidateUploadMock(...args),
  uploadToPresignedUrl: (...args: unknown[]) =>
    uploadToPresignedUrlMock(...args),
  createCandidate: (...args: unknown[]) => createCandidateMock(...args),
  updateCandidate: (...args: unknown[]) => updateCandidateMock(...args),
  deleteCandidate: (...args: unknown[]) => deleteCandidateMock(...args),
}));

const candidate: Candidate = {
  id: "candidate-1",
  jobId: "job-1",
  recruiterProfileId: "rec-1",
  fullName: "Jane Doe",
  email: "jane@example.com",
  phone: "555-1234",
  overview: "Strong backend candidate.",
  pitch: null,
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
  // A name is the only thing a submission requires now.
  await user.type(screen.getByLabelText("Full Name"), "Jane Doe");
}

describe("CandidateForm", () => {
  beforeEach(() => {
    fetchCandidatesMock.mockReset();
    fetchAttachmentsMock.mockReset();
    presignCandidateUploadMock.mockReset();
    uploadToPresignedUrlMock.mockReset();
    createCandidateMock.mockReset();
    updateCandidateMock.mockReset();
    deleteCandidateMock.mockReset();
  });

  it("keeps submit disabled until a valid CV file is chosen", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CandidateForm jobId="job-1" onDone={vi.fn()} />);

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
    renderWithProviders(<CandidateForm jobId="job-1" onDone={vi.fn()} />);

    const pngFile = new File(["x"], "cv.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(/cv \/ resume/i), pngFile);

    expect(screen.getByText(/pdf or word document/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /submit candidate/i }),
    ).toBeDisabled();
  });

  it("rejects an oversized file with a size message", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CandidateForm jobId="job-1" onDone={vi.fn()} />);

    const oversized = pdfFile();
    Object.defineProperty(oversized, "size", {
      value: MAX_DOCUMENT_BYTES + 1,
      configurable: true,
    });
    await user.upload(screen.getByLabelText(/cv \/ resume/i), oversized);

    expect(screen.getByText(/mb or smaller/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /submit candidate/i }),
    ).toBeDisabled();
  });

  it("shows the expected salary as money while sending bare cents", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CandidateForm jobId="job-1" onDone={vi.fn()} />);

    const salary = screen.getByLabelText(/expected salary/i);
    await user.type(salary, "30000");

    // What the client reported: a salary read back as "30000" rather than as
    // an amount. The "$" is an adornment beside the field, the commas are in
    // it.
    expect(salary).toHaveValue("30,000");
  });

  it("never asks for the candidate's direct contact details", async () => {
    // A direct line is what lets a company go around the recruiter who
    // sourced the candidate, so the form collects neither.
    renderWithProviders(<CandidateForm jobId="job-1" onDone={vi.fn()} />);

    expect(screen.queryByLabelText(/phone/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
  });

  it("sends a submission carrying no contact details at all", async () => {
    const user = userEvent.setup();
    presignCandidateUploadMock.mockResolvedValue({
      s3Key: "staged/key.pdf",
      uploadUrl: "https://s3.example.com/upload",
    });
    uploadToPresignedUrlMock.mockResolvedValue(undefined);
    createCandidateMock.mockResolvedValue(candidate);

    renderWithProviders(<CandidateForm jobId="job-1" onDone={vi.fn()} />);
    await fillRequiredFields(user);
    await user.upload(screen.getByLabelText(/cv \/ resume/i), pdfFile());
    await user.click(screen.getByRole("button", { name: /submit candidate/i }));

    await waitFor(() => expect(createCandidateMock).toHaveBeenCalled());
    const sent = createCandidateMock.mock.calls[0]?.[1] as Record<
      string,
      unknown
    >;
    expect(sent.email).toBeUndefined();
    expect(sent.phone).toBeUndefined();
  });

  it("converts the dollars input to cents in the mutation payload", async () => {
    const user = userEvent.setup();
    presignCandidateUploadMock.mockResolvedValue({
      s3Key: "staged/key.pdf",
      uploadUrl: "https://s3.example.com/upload",
    });
    uploadToPresignedUrlMock.mockResolvedValue(undefined);
    createCandidateMock.mockResolvedValue(candidate);
    const onDone = vi.fn();

    renderWithProviders(<CandidateForm jobId="job-1" onDone={onDone} />);

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
      <CandidateForm jobId="job-1" candidate={candidate} onDone={vi.fn()} />,
    );

    expect(screen.queryByLabelText(/cv \/ resume/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Full Name")).toHaveValue("Jane Doe");
    expect(screen.getByLabelText(/expected salary/i)).toHaveValue("1,500");
  });
});

describe("editing an overview written before the rich-text editor", () => {
  it("keeps the line breaks of a stored plain-text overview", () => {
    // Tiptap parses its seed as HTML, where a newline is just whitespace, so
    // handing it the raw stored text flattened the paragraphs — and the next
    // save persisted the flattened version.
    renderWithProviders(
      <CandidateForm
        jobId="job-1"
        candidate={{
          ...candidate,
          overview: "First line.\nSecond line.\n\nNew paragraph.",
        }}
        onDone={vi.fn()}
      />,
    );

    const editor = document.querySelector(".ProseMirror");
    expect(editor).not.toBeNull();
    expect(editor?.querySelectorAll("p")).toHaveLength(2);
    expect(editor?.querySelectorAll("br")).toHaveLength(1);
    expect(editor?.textContent).toContain("Second line.");
  });
});

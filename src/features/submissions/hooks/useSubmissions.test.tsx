import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Submission } from "../schemas";
import { useCreateOrOpenSubmission } from "./useSubmissions";

const createSubmissionMock = vi.fn();
const fetchSubmissionsMock = vi.fn();
vi.mock("../api/submissions", () => ({
  createSubmission: (...args: unknown[]) => createSubmissionMock(...args),
  fetchSubmissions: (...args: unknown[]) => fetchSubmissionsMock(...args),
  fetchSubmission: vi.fn(),
  updateSubmissionStatus: vi.fn(),
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

function conflictError(): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(
    "Conflict",
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    {
      data: undefined,
      status: 409,
      statusText: "Conflict",
      headers: new AxiosHeaders(),
      config,
    },
  );
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useCreateOrOpenSubmission", () => {
  beforeEach(() => {
    createSubmissionMock.mockReset();
    fetchSubmissionsMock.mockReset();
  });

  it("returns the created submission on success", async () => {
    createSubmissionMock.mockResolvedValue(submission);

    const { result } = renderHook(() => useCreateOrOpenSubmission(), {
      wrapper,
    });
    result.current.mutate({ jobId: "job-1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(submission);
  });

  it("falls back to the existing submission on a duplicate 409", async () => {
    createSubmissionMock.mockRejectedValue(conflictError());
    fetchSubmissionsMock.mockResolvedValue({
      data: [submission],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const { result } = renderHook(() => useCreateOrOpenSubmission(), {
      wrapper,
    });
    result.current.mutate({ jobId: "job-1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(submission);
    expect(fetchSubmissionsMock).toHaveBeenCalledWith({
      jobId: "job-1",
      page: 1,
    });
  });
});

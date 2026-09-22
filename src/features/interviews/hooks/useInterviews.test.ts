import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createInterviewMock, proposeSlotsMock } = vi.hoisted(() => ({
  createInterviewMock: vi.fn(),
  proposeSlotsMock: vi.fn(),
}));

// The real module builds an `apiClient` at import time and throws without
// `NEXT_PUBLIC_API_URL`, so the whole API surface this hook module imports is
// stubbed rather than only the two calls under test.
vi.mock("../api/interviews", () => ({
  cancelInterview: vi.fn(),
  confirmSlot: vi.fn(),
  counterRequest: vi.fn(),
  createInterview: createInterviewMock,
  fetchInterview: vi.fn(),
  fetchInterviews: vi.fn(),
  proposeSlots: proposeSlotsMock,
  recordOutcome: vi.fn(),
  setMeetingUrl: vi.fn(),
}));

// Imported after the mock so the hook picks up the mocked module.
import { useProposeInterviewTimes } from "./useInterviews";

const SLOTS = {
  slots: [
    { startAt: "2026-10-01T09:00:00.000Z", endAt: "2026-10-01T10:00:00.000Z" },
  ],
};

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useProposeInterviewTimes", () => {
  beforeEach(() => {
    createInterviewMock.mockReset();
    proposeSlotsMock.mockReset();
    proposeSlotsMock.mockResolvedValue({
      id: "proposal-1",
      status: "proposed",
      note: null,
      slots: [],
    });
  });

  it("proposes against an existing interview without opening another", async () => {
    const { result } = renderHook(
      () =>
        useProposeInterviewTimes({ kind: "existing", interviewId: "int-1" }),
      { wrapper },
    );

    act(() => result.current.mutate(SLOTS));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createInterviewMock).not.toHaveBeenCalled();
    expect(proposeSlotsMock).toHaveBeenCalledWith("int-1", SLOTS);
  });

  it("opens the interview with the chosen type, then proposes against it", async () => {
    createInterviewMock.mockResolvedValue({ id: "int-new" });

    const { result } = renderHook(
      () =>
        useProposeInterviewTimes({
          kind: "new",
          candidateId: "cand-1",
          interviewType: "in_person",
        }),
      { wrapper },
    );

    act(() => result.current.mutate(SLOTS));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createInterviewMock).toHaveBeenCalledWith({
      candidateId: "cand-1",
      interviewType: "in_person",
    });
    expect(proposeSlotsMock).toHaveBeenCalledWith("int-new", SLOTS);
  });

  it("reuses the interview it already opened when a failed propose is retried", async () => {
    createInterviewMock.mockResolvedValue({ id: "int-new" });
    proposeSlotsMock.mockRejectedValueOnce(new Error("slots overlap"));

    const { result } = renderHook(
      () =>
        useProposeInterviewTimes({
          kind: "new",
          candidateId: "cand-1",
          interviewType: "video",
        }),
      { wrapper },
    );

    act(() => result.current.mutate(SLOTS));
    await waitFor(() => expect(result.current.isError).toBe(true));

    act(() => result.current.mutate(SLOTS));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // A second create could only 409 against the first, dead-ending the form.
    expect(createInterviewMock).toHaveBeenCalledTimes(1);
    expect(proposeSlotsMock).toHaveBeenNthCalledWith(2, "int-new", SLOTS);
  });
});

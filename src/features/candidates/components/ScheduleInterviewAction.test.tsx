import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import {
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_TYPES,
  interviewTypeSchema,
  type Interview,
} from "@/features/interviews/schemas";
import { ScheduleInterviewAction } from "./ScheduleInterviewAction";

const useInterviewsMock = vi.fn();
const useCreateInterviewMock = vi.fn();

// `INTERVIEW_TYPES`/`INTERVIEW_TYPE_LABELS`/`interviewTypeSchema` come from
// the dependency-free schemas module directly rather than `importActual` on
// the barrel — the barrel's real `useInterviews`/`useCreateInterview` reach
// into `../api/interviews`, which builds an `apiClient` at import time and
// throws without `NEXT_PUBLIC_API_URL` set. Only the two data hooks that
// decide whether this candidate has an open interview need stubbing.
vi.mock("@/features/interviews", () => ({
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_TYPES,
  interviewTypeSchema,
  useInterviews: (...args: unknown[]) => useInterviewsMock(...args),
  useCreateInterview: (...args: unknown[]) => useCreateInterviewMock(...args),
  ProposeSlotsForm: () => <div>Propose slots form</div>,
}));

function interview(overrides: Partial<Interview> = {}): Interview {
  return {
    id: "interview-1",
    jobId: "job-1",
    candidateId: "candidate-1",
    interviewType: "video",
    status: "proposed",
    round: 1,
    confirmedSlotStart: null,
    confirmedSlotEnd: null,
    meetingJoinUrl: null,
    outcome: null,
    passFeedback: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("ScheduleInterviewAction", () => {
  beforeEach(() => {
    useInterviewsMock.mockReset();
    useCreateInterviewMock.mockReset();
    useCreateInterviewMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    });
  });

  it("disables scheduling with a readable reason when the candidate already has an interview scheduled", () => {
    useInterviewsMock.mockReturnValue({
      data: {
        data: [interview({ status: "scheduled" })],
        meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
      },
      isPending: false,
    });

    renderWithProviders(<ScheduleInterviewAction candidateId="candidate-1" />);

    expect(
      screen.getByRole("button", { name: /schedule interview/i }),
    ).toBeDisabled();
    expect(
      screen.getByText(/already has an interview scheduled/i),
    ).toBeInTheDocument();
  });

  it("disables scheduling with a readable reason when the candidate already has an interview awaiting a time", () => {
    useInterviewsMock.mockReturnValue({
      data: {
        data: [interview({ status: "proposed" })],
        meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
      },
      isPending: false,
    });

    renderWithProviders(<ScheduleInterviewAction candidateId="candidate-1" />);

    expect(
      screen.getByRole("button", { name: /schedule interview/i }),
    ).toBeDisabled();
    expect(
      screen.getByText(/already has an interview awaiting a time/i),
    ).toBeInTheDocument();
  });

  it("enables scheduling with no disabled reason when the candidate has no open interview", () => {
    useInterviewsMock.mockReturnValue({
      data: {
        data: [interview({ status: "canceled" })],
        meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
      },
      isPending: false,
    });

    renderWithProviders(<ScheduleInterviewAction candidateId="candidate-1" />);

    expect(
      screen.getByRole("button", { name: /schedule interview/i }),
    ).toBeEnabled();
    expect(
      screen.queryByText(/already has an interview/i),
    ).not.toBeInTheDocument();
  });
});

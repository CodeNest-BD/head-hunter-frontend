import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import {
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_TYPES,
  interviewTypeSchema,
  type Interview,
} from "@/features/interviews/schemas";
import { createInterviewErrorMessage } from "@/features/interviews/utils/interviewErrorMessages";
import { ScheduleInterviewAction } from "./ScheduleInterviewAction";

const useInterviewsMock = vi.fn();
const useCreateInterviewMock = vi.fn();

// The schemas and error-copy modules are imported directly rather than through
// `importActual` on the barrel — the barrel's real hooks reach into
// `../api/interviews`, which builds an `apiClient` at import time and throws
// without `NEXT_PUBLIC_API_URL` set. `OpenInterviewActions` is stubbed to
// report the interview it was handed and the panel it was told to open on;
// its own behaviour is covered by its own test.
vi.mock("@/features/interviews", () => ({
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_TYPES,
  interviewTypeSchema,
  createInterviewErrorMessage,
  useInterviews: (...args: unknown[]) => useInterviewsMock(...args),
  useCreateInterview: (...args: unknown[]) => useCreateInterviewMock(...args),
  OpenInterviewActions: ({
    interview,
    initialPanel = "none",
  }: {
    interview: Interview;
    initialPanel?: string;
  }) => (
    <div>
      Open interview {interview.id} ({interview.status}) panel:{initialPanel}
    </div>
  ),
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
    liveProposal: null,
    ...overrides,
  };
}

function interviewList(interviews: Interview[]) {
  return {
    data: {
      data: interviews,
      meta: {
        page: 1,
        limit: 50,
        total: interviews.length,
        totalPages: 1,
      },
    },
    isPending: false,
  };
}

function createMutationStub(overrides: Record<string, unknown> = {}) {
  return {
    mutate: vi.fn(),
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    ...overrides,
  };
}

describe("ScheduleInterviewAction", () => {
  beforeEach(() => {
    useInterviewsMock.mockReset();
    useCreateInterviewMock.mockReset();
    useCreateInterviewMock.mockReturnValue(createMutationStub());
  });

  it("hands an interview awaiting a time over to its own actions instead of blocking", () => {
    useInterviewsMock.mockReturnValue(
      interviewList([interview({ status: "proposed" })]),
    );

    renderWithProviders(<ScheduleInterviewAction candidateId="candidate-1" />);

    expect(
      screen.getByText(/open interview interview-1 \(proposed\) panel:none/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /schedule interview/i }),
    ).not.toBeInTheDocument();
  });

  it("hands a scheduled interview over to its own actions", () => {
    useInterviewsMock.mockReturnValue(
      interviewList([interview({ status: "scheduled" })]),
    );

    renderWithProviders(<ScheduleInterviewAction candidateId="candidate-1" />);

    expect(
      screen.getByText(/open interview interview-1 \(scheduled\) panel:none/i),
    ).toBeInTheDocument();
  });

  it("offers to schedule when the candidate's only interview is closed", () => {
    useInterviewsMock.mockReturnValue(
      interviewList([interview({ status: "canceled" })]),
    );

    renderWithProviders(<ScheduleInterviewAction candidateId="candidate-1" />);

    expect(
      screen.getByRole("button", { name: /schedule interview/i }),
    ).toBeEnabled();
    expect(screen.queryByText(/open interview/i)).not.toBeInTheDocument();
  });

  it("creates an interview with the selected type", () => {
    const mutate = vi.fn();
    useInterviewsMock.mockReturnValue(interviewList([]));
    useCreateInterviewMock.mockReturnValue(createMutationStub({ mutate }));

    renderWithProviders(<ScheduleInterviewAction candidateId="candidate-1" />);
    screen.getByRole("button", { name: /schedule interview/i }).click();

    expect(mutate).toHaveBeenCalledWith({
      candidateId: "candidate-1",
      interviewType: "video",
    });
  });

  it("opens the propose-times panel on the interview it just created, before the list refetches", () => {
    useInterviewsMock.mockReturnValue(interviewList([]));
    useCreateInterviewMock.mockReturnValue(
      createMutationStub({ data: interview({ id: "interview-new" }) }),
    );

    renderWithProviders(<ScheduleInterviewAction candidateId="candidate-1" />);

    expect(
      screen.getByText(
        /open interview interview-new \(proposed\) panel:proposing/i,
      ),
    ).toBeInTheDocument();
  });

  it("offers to schedule again once the interview it created has been withdrawn", () => {
    const created = interview({ id: "interview-new" });
    // The mutation still holds its `proposed` snapshot — the refetched list,
    // which now calls the same interview canceled, has to win.
    useInterviewsMock.mockReturnValue(
      interviewList([{ ...created, status: "canceled" }]),
    );
    useCreateInterviewMock.mockReturnValue(
      createMutationStub({ data: created }),
    );

    renderWithProviders(<ScheduleInterviewAction candidateId="candidate-1" />);

    expect(
      screen.getByRole("button", { name: /schedule interview/i }),
    ).toBeEnabled();
    expect(screen.queryByText(/open interview/i)).not.toBeInTheDocument();
  });

  it("leaves the propose panel closed once the created interview is the list's own", () => {
    const created = interview({ id: "interview-new" });
    useInterviewsMock.mockReturnValue(interviewList([created]));
    useCreateInterviewMock.mockReturnValue(
      createMutationStub({ data: created }),
    );

    renderWithProviders(<ScheduleInterviewAction candidateId="candidate-1" />);

    expect(
      screen.getByText(/open interview interview-new \(proposed\) panel:none/i),
    ).toBeInTheDocument();
  });

  it("explains a create that lost the race to another open interview", () => {
    useInterviewsMock.mockReturnValue(interviewList([]));
    useCreateInterviewMock.mockReturnValue(
      createMutationStub({
        isError: true,
        error: new Error("boom"),
      }),
    );

    renderWithProviders(<ScheduleInterviewAction candidateId="candidate-1" />);

    expect(screen.getByText(/could not start scheduling/i)).toBeInTheDocument();
  });
});

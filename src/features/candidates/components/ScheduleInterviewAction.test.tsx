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
import {
  candidateNegotiationState,
  type CandidateNegotiationState,
} from "@/features/conversations/utils/candidateNegotiationState";
import { ScheduleInterviewAction } from "./ScheduleInterviewAction";

const useCreateInterviewMock = vi.fn();

// The schemas and error-copy modules are imported directly rather than through
// `importActual` on the barrel — the barrel's real hooks reach into
// `../api/interviews`, which builds an `apiClient` at import time and throws
// without `NEXT_PUBLIC_API_URL` set. `useInterviews` is no longer part of this
// mock: the component reads its candidate's negotiation state from a prop
// instead of mounting its own query. `OpenInterviewActions` is stubbed to
// report the interview it was handed and the panel it was told to open on;
// its own behaviour is covered by its own test.
vi.mock("@/features/interviews", () => ({
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_TYPES,
  interviewTypeSchema,
  createInterviewErrorMessage,
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

/** Runs the candidate's interviews through the same derivation the page
 * itself uses, so these tests exercise the real `negotiationState` shape
 * the component is handed rather than a hand-rolled stand-in. */
function negotiationStateFor(
  interviews: Interview[],
): CandidateNegotiationState | null {
  return candidateNegotiationState(interviews, []).get("candidate-1") ?? null;
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
    useCreateInterviewMock.mockReset();
    useCreateInterviewMock.mockReturnValue(createMutationStub());
  });

  it("hands an interview awaiting a time over to its own actions instead of blocking", () => {
    renderWithProviders(
      <ScheduleInterviewAction
        candidateId="candidate-1"
        negotiationState={negotiationStateFor([
          interview({ status: "proposed" }),
        ])}
      />,
    );

    expect(
      screen.getByText(/open interview interview-1 \(proposed\) panel:none/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /schedule interview/i }),
    ).not.toBeInTheDocument();
  });

  it("hands a scheduled interview over to its own actions", () => {
    renderWithProviders(
      <ScheduleInterviewAction
        candidateId="candidate-1"
        negotiationState={negotiationStateFor([
          interview({ status: "scheduled" }),
        ])}
      />,
    );

    expect(
      screen.getByText(/open interview interview-1 \(scheduled\) panel:none/i),
    ).toBeInTheDocument();
  });

  it("offers to schedule when the candidate's only interview is closed", () => {
    renderWithProviders(
      <ScheduleInterviewAction
        candidateId="candidate-1"
        negotiationState={negotiationStateFor([
          interview({ status: "canceled" }),
        ])}
      />,
    );

    expect(
      screen.getByRole("button", { name: /schedule interview/i }),
    ).toBeEnabled();
    expect(screen.queryByText(/open interview/i)).not.toBeInTheDocument();
  });

  it("creates an interview with the selected type", () => {
    const mutate = vi.fn();
    useCreateInterviewMock.mockReturnValue(createMutationStub({ mutate }));

    renderWithProviders(
      <ScheduleInterviewAction
        candidateId="candidate-1"
        negotiationState={null}
      />,
    );
    screen.getByRole("button", { name: /schedule interview/i }).click();

    expect(mutate).toHaveBeenCalledWith({
      candidateId: "candidate-1",
      interviewType: "video",
    });
  });

  it("opens the propose-times panel on the interview it just created, before the negotiation state refetches", () => {
    useCreateInterviewMock.mockReturnValue(
      createMutationStub({ data: interview({ id: "interview-new" }) }),
    );

    renderWithProviders(
      <ScheduleInterviewAction
        candidateId="candidate-1"
        negotiationState={null}
      />,
    );

    expect(
      screen.getByText(
        /open interview interview-new \(proposed\) panel:proposing/i,
      ),
    ).toBeInTheDocument();
  });

  it("offers to schedule again once the interview it created has been withdrawn", () => {
    const created = interview({ id: "interview-new" });
    // The mutation still holds its `proposed` snapshot — the refetched
    // negotiation state, which now calls the same interview canceled, has to
    // win.
    const negotiationState = negotiationStateFor([
      { ...created, status: "canceled" },
    ]);
    useCreateInterviewMock.mockReturnValue(
      createMutationStub({ data: created }),
    );

    renderWithProviders(
      <ScheduleInterviewAction
        candidateId="candidate-1"
        negotiationState={negotiationState}
      />,
    );

    expect(
      screen.getByRole("button", { name: /schedule interview/i }),
    ).toBeEnabled();
    expect(screen.queryByText(/open interview/i)).not.toBeInTheDocument();
  });

  it("leaves the propose panel closed once the created interview is the negotiation state's own", () => {
    const created = interview({ id: "interview-new" });
    const negotiationState = negotiationStateFor([created]);
    useCreateInterviewMock.mockReturnValue(
      createMutationStub({ data: created }),
    );

    renderWithProviders(
      <ScheduleInterviewAction
        candidateId="candidate-1"
        negotiationState={negotiationState}
      />,
    );

    expect(
      screen.getByText(/open interview interview-new \(proposed\) panel:none/i),
    ).toBeInTheDocument();
  });

  it("explains a create that lost the race to another open interview", () => {
    useCreateInterviewMock.mockReturnValue(
      createMutationStub({
        isError: true,
        error: new Error("boom"),
      }),
    );

    renderWithProviders(
      <ScheduleInterviewAction
        candidateId="candidate-1"
        negotiationState={null}
      />,
    );

    expect(screen.getByText(/could not start scheduling/i)).toBeInTheDocument();
  });
});

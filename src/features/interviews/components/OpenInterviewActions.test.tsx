import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import { formatDateTime } from "@/shared/utils/formatDate";
import type { Interview } from "../schemas";
import { OpenInterviewActions } from "./OpenInterviewActions";

const useCancelInterviewMock = vi.fn();

// Only the mutation this component owns is stubbed; `ProposeSlotsForm` stands in
// for the whole propose flow (covered by the schema and slot-timing tests), and
// stubbing it also keeps `../api/interviews` — which needs
// `NEXT_PUBLIC_API_URL` at import time — out of this test.
vi.mock("../hooks/useInterviews", () => ({
  useCancelInterview: (...args: unknown[]) => useCancelInterviewMock(...args),
}));
vi.mock("./ProposeSlotsForm", () => ({
  ProposeSlotsForm: ({ interviewId }: { interviewId: string }) => (
    <div>Propose slots form for {interviewId}</div>
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

function mutationStub(overrides: Record<string, unknown> = {}) {
  return {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    ...overrides,
  };
}

describe("OpenInterviewActions", () => {
  beforeEach(() => {
    useCancelInterviewMock.mockReset();
    useCancelInterviewMock.mockReturnValue(mutationStub());
  });

  it("offers times and withdrawal for an interview awaiting a time", () => {
    renderWithProviders(<OpenInterviewActions interview={interview()} />);

    expect(screen.getByText(/awaiting a time/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /propose times/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /withdraw/i }),
    ).toBeInTheDocument();
  });

  it("opens the propose-times form for this interview", () => {
    renderWithProviders(<OpenInterviewActions interview={interview()} />);

    fireEvent.click(screen.getByRole("button", { name: /propose times/i }));

    expect(
      screen.getByText(/propose slots form for interview-1/i),
    ).toBeInTheDocument();
  });

  it("starts on the propose-times form when the caller already knows the next step", () => {
    renderWithProviders(
      <OpenInterviewActions interview={interview()} initialPanel="proposing" />,
    );

    expect(
      screen.getByText(/propose slots form for interview-1/i),
    ).toBeInTheDocument();
  });

  it("withdraws only after the confirmation step", () => {
    const mutate = vi.fn();
    useCancelInterviewMock.mockReturnValue(mutationStub({ mutate }));

    renderWithProviders(<OpenInterviewActions interview={interview()} />);
    fireEvent.click(screen.getByRole("button", { name: /^withdraw$/i }));

    expect(mutate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /confirm withdraw/i }));

    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it("closes the confirmation once the withdrawal succeeds, so it cannot be sent twice", () => {
    const mutate = vi.fn(
      (_variables: undefined, options?: { onSuccess?: () => void }) =>
        options?.onSuccess?.(),
    );
    useCancelInterviewMock.mockReturnValue(mutationStub({ mutate }));

    renderWithProviders(<OpenInterviewActions interview={interview()} />);
    fireEvent.click(screen.getByRole("button", { name: /^withdraw$/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm withdraw/i }));

    expect(
      screen.queryByRole("button", { name: /confirm withdraw/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /propose times/i }),
    ).toBeInTheDocument();
  });

  it("explains a withdrawal the interview has already moved past", () => {
    useCancelInterviewMock.mockReturnValue(
      mutationStub({ isError: true, error: new Error("boom") }),
    );

    renderWithProviders(<OpenInterviewActions interview={interview()} />);

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("defers to ProposalCard once a batch is open, instead of offering a second way to propose times", () => {
    const { container } = renderWithProviders(
      <OpenInterviewActions
        interview={interview({
          liveProposal: { id: "prop-1", status: "proposed", slots: [] },
        })}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the agreed time for a scheduled interview instead of any action", () => {
    const start = "2026-09-01T16:00:00.000Z";
    const end = "2026-09-01T17:00:00.000Z";

    renderWithProviders(
      <OpenInterviewActions
        interview={interview({
          status: "scheduled",
          confirmedSlotStart: start,
          confirmedSlotEnd: end,
        })}
      />,
    );

    expect(
      screen.getByText(
        `${formatDateTime(start)} – ${formatDateTime(end)}`.replace(
          /\s+/g,
          " ",
        ),
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /propose times/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /withdraw/i }),
    ).not.toBeInTheDocument();
  });
});

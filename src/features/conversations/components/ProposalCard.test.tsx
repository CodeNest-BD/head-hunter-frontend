import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import { withdrawInterviewErrorMessage } from "@/features/interviews/utils/interviewErrorMessages";
import { ApiError } from "@/shared/libs/errorHandler";
import { formatDateTime } from "@/shared/utils/formatDate";
import { ProposalCard, type ProposalEventData } from "./ProposalCard";

const useConfirmSlotMock = vi.fn();
const useCounterRequestMock = vi.fn();
const useCancelInterviewMock = vi.fn();

// The real error copy is pulled in from its own module — it is shared with the
// candidate card's withdraw button, and asserting on stubbed wording would let
// the two drift apart unnoticed.
vi.mock("@/features/interviews", () => ({
  useConfirmSlot: (...args: unknown[]) => useConfirmSlotMock(...args),
  useCounterRequest: (...args: unknown[]) => useCounterRequestMock(...args),
  useCancelInterview: (...args: unknown[]) => useCancelInterviewMock(...args),
  withdrawInterviewErrorMessage,
  ProposeSlotsForm: () => <div>Propose slots form</div>,
}));

function mutationStub() {
  return { mutate: vi.fn(), isPending: false, isError: false, error: null };
}

const slots = [
  {
    id: "slot-1",
    startAt: "2026-09-01T16:00:00.000Z",
    endAt: "2026-09-01T17:00:00.000Z",
  },
  {
    id: "slot-2",
    startAt: "2026-09-02T16:00:00.000Z",
    endAt: "2026-09-02T17:00:00.000Z",
  },
];

function proposalData(
  overrides: Partial<ProposalEventData> = {},
): ProposalEventData {
  return {
    kind: "proposal",
    interviewId: "interview-1",
    availabilityProposalId: "proposal-1",
    proposalStatus: "proposed",
    interviewStatus: "proposed",
    confirmedSlotStart: null,
    confirmedSlotEnd: null,
    slots,
    ...overrides,
  };
}

describe("ProposalCard", () => {
  beforeEach(() => {
    useConfirmSlotMock.mockReset();
    useCounterRequestMock.mockReset();
    useCancelInterviewMock.mockReset();
    useConfirmSlotMock.mockReturnValue(mutationStub());
    useCounterRequestMock.mockReturnValue(mutationStub());
    useCancelInterviewMock.mockReturnValue(mutationStub());
  });

  it("renders each proposed slot with a readable local date and time", () => {
    renderWithProviders(
      <ProposalCard
        title="Availability proposed"
        note={null}
        data={proposalData()}
        viewerParty="recruiter"
      />,
    );

    expect(
      screen.getByText(formatDateTime(slots[0].startAt), { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(formatDateTime(slots[1].startAt), { exact: false }),
    ).toBeInTheDocument();
  });

  it("lets the recruiter select a slot and offers Confirm and Request other times", () => {
    renderWithProviders(
      <ProposalCard
        title="Availability proposed"
        note={null}
        data={proposalData()}
        viewerParty="recruiter"
      />,
    );

    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: /^confirm$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /request other times/i }),
    ).toBeInTheDocument();
  });

  it("shows the company read-only slots and a way to propose new times, with no recruiter actions", () => {
    renderWithProviders(
      <ProposalCard
        title="Availability proposed"
        note={null}
        data={proposalData()}
        viewerParty="company"
      />,
    );

    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(
      screen.queryByRole("button", { name: /^confirm$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /request other times/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /propose new times/i }),
    ).toBeInTheDocument();
  });

  it("shows the agreed time and no action buttons once the proposal is confirmed", () => {
    renderWithProviders(
      <ProposalCard
        title="Interview time confirmed"
        note={null}
        data={proposalData({
          proposalStatus: "confirmed",
          interviewStatus: "scheduled",
          confirmedSlotStart: "2026-09-01T16:00:00.000Z",
          confirmedSlotEnd: "2026-09-01T17:00:00.000Z",
        })}
        viewerParty="company"
      />,
    );

    expect(
      screen.getByText(formatDateTime("2026-09-01T16:00:00.000Z"), {
        exact: false,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers no action buttons on an open proposal once the interview is canceled", () => {
    renderWithProviders(
      <ProposalCard
        title="Availability proposed"
        note={null}
        data={proposalData({
          proposalStatus: "proposed",
          interviewStatus: "canceled",
        })}
        viewerParty="recruiter"
      />,
    );

    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers no action buttons on a counter-requested proposal once the interview is completed", () => {
    renderWithProviders(
      <ProposalCard
        title="New times requested"
        note="Mornings only, please."
        data={proposalData({
          proposalStatus: "counter_requested",
          interviewStatus: "completed",
        })}
        viewerParty="company"
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the note when the recruiter has requested other times", () => {
    renderWithProviders(
      <ProposalCard
        title="New times requested"
        note="Mornings only, please."
        data={proposalData({ proposalStatus: "counter_requested" })}
        viewerParty="company"
      />,
    );

    expect(screen.getByText("Mornings only, please.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /propose new times/i }),
    ).toBeInTheDocument();
  });

  it("lets the proposer withdraw an interview still awaiting a time", () => {
    const cancelMutate = vi.fn();
    useCancelInterviewMock.mockReturnValue({
      mutate: cancelMutate,
      isPending: false,
      isError: false,
      error: null,
    });

    renderWithProviders(
      <ProposalCard
        title="Availability proposed"
        note={null}
        data={proposalData({
          proposalStatus: "proposed",
          interviewStatus: "proposed",
        })}
        viewerParty="company"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^withdraw$/i }));
    expect(
      screen.getByText(/cancels the interview and cannot be undone/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /confirm withdraw/i }));
    expect(cancelMutate).toHaveBeenCalled();
  });

  it("does not offer withdraw to the counterparty", () => {
    renderWithProviders(
      <ProposalCard
        title="Availability proposed"
        note={null}
        data={proposalData({
          proposalStatus: "proposed",
          interviewStatus: "proposed",
        })}
        viewerParty="recruiter"
      />,
    );

    expect(
      screen.queryByRole("button", { name: /withdraw/i }),
    ).not.toBeInTheDocument();
  });

  it("does not offer withdraw once a slot is confirmed", () => {
    renderWithProviders(
      <ProposalCard
        title="Interview time confirmed"
        note={null}
        data={proposalData({
          proposalStatus: "confirmed",
          interviewStatus: "scheduled",
          confirmedSlotStart: "2026-09-01T16:00:00.000Z",
          confirmedSlotEnd: "2026-09-01T17:00:00.000Z",
        })}
        viewerParty="company"
      />,
    );

    expect(
      screen.queryByRole("button", { name: /withdraw/i }),
    ).not.toBeInTheDocument();
  });

  it("offers the company both actions while its batch is the live one", () => {
    renderWithProviders(
      <ProposalCard
        title="Availability proposed"
        note={null}
        data={proposalData({
          proposalStatus: "proposed",
          interviewStatus: "proposed",
        })}
        viewerParty="company"
      />,
    );

    expect(
      screen.getByRole("button", { name: /propose new times/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^withdraw$/i }),
    ).toBeInTheDocument();
  });

  it("offers the company nothing on a batch superseded by newer times, even while the interview still awaits one", () => {
    renderWithProviders(
      <ProposalCard
        title="Availability replaced by newer times"
        note={null}
        data={proposalData({
          proposalStatus: "expired",
          interviewStatus: "proposed",
        })}
        viewerParty="company"
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers the recruiter nothing on a batch superseded by newer times", () => {
    renderWithProviders(
      <ProposalCard
        title="Availability replaced by newer times"
        note={null}
        data={proposalData({
          proposalStatus: "expired",
          interviewStatus: "proposed",
        })}
        viewerParty="recruiter"
      />,
    );

    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers the company nothing on a confirmed batch", () => {
    renderWithProviders(
      <ProposalCard
        title="Interview time confirmed"
        note={null}
        data={proposalData({
          proposalStatus: "confirmed",
          interviewStatus: "scheduled",
          confirmedSlotStart: "2026-09-01T16:00:00.000Z",
          confirmedSlotEnd: "2026-09-01T17:00:00.000Z",
        })}
        viewerParty="company"
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers the recruiter nothing on a counter-requested batch it is waiting on", () => {
    renderWithProviders(
      <ProposalCard
        title="New times requested"
        note="Mornings only, please."
        data={proposalData({
          proposalStatus: "counter_requested",
          interviewStatus: "proposed",
        })}
        viewerParty="recruiter"
      />,
    );

    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers the company nothing on a counter-requested batch once a later time was scheduled", () => {
    // Reachable: the backend only expires batches still in `proposed`, so a
    // counter-requested one outlives a newer batch being confirmed. That card
    // is history, and its Withdraw would cancel a scheduled interview.
    renderWithProviders(
      <ProposalCard
        title="New times requested"
        note="Mornings only, please."
        data={proposalData({
          proposalStatus: "counter_requested",
          interviewStatus: "scheduled",
        })}
        viewerParty="company"
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers the company nothing when the interview status is not recognised", () => {
    renderWithProviders(
      <ProposalCard
        title="Availability proposed"
        note={null}
        data={proposalData({
          proposalStatus: "proposed",
          interviewStatus: "unknown",
        })}
        viewerParty="company"
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers the company nothing when the proposal status is not recognised, even while the interview awaits a time", () => {
    renderWithProviders(
      <ProposalCard
        title="Availability proposed"
        note={null}
        data={proposalData({
          proposalStatus: "unknown",
          interviewStatus: "proposed",
        })}
        viewerParty="company"
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("does not offer withdraw once the interview is canceled", () => {
    renderWithProviders(
      <ProposalCard
        title="Availability proposed"
        note={null}
        data={proposalData({
          proposalStatus: "proposed",
          interviewStatus: "canceled",
        })}
        viewerParty="company"
      />,
    );

    expect(
      screen.queryByRole("button", { name: /withdraw/i }),
    ).not.toBeInTheDocument();
  });

  it("shows every sentence of a validation failure, not just the first", () => {
    // This card renders its errors inline and suppresses the global toast, so
    // the toast's title/description split cannot carry the extra sentences —
    // the inline copy has to.
    useCounterRequestMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: new ApiError("A note is required", {
        statusCode: 400,
        messages: ["A note is required", "Keep the note under 2000 characters"],
      }),
    });

    renderWithProviders(
      <ProposalCard
        title="Availability proposed"
        note={null}
        data={proposalData()}
        viewerParty="recruiter"
      />,
    );

    expect(
      screen.getByText(
        "A note is required. Keep the note under 2000 characters.",
      ),
    ).toBeInTheDocument();
  });

  it("leaves the withdraw confirmation open and shows an error when cancellation fails", () => {
    useCancelInterviewMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: new ApiError("Conflict", { statusCode: 409 }),
    });

    renderWithProviders(
      <ProposalCard
        title="Availability proposed"
        note={null}
        data={proposalData({
          proposalStatus: "proposed",
          interviewStatus: "proposed",
        })}
        viewerParty="company"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^withdraw$/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm withdraw/i }));

    expect(
      screen.getByRole("button", { name: /confirm withdraw/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/no longer be withdrawn/i)).toBeInTheDocument();
  });
});

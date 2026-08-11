import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import { formatDateTime } from "@/shared/utils/formatDate";
import { ProposalCard, type ProposalEventData } from "./ProposalCard";

const useConfirmSlotMock = vi.fn();
const useCounterRequestMock = vi.fn();
const useInterviewMock = vi.fn();

vi.mock("@/features/interviews", () => ({
  useConfirmSlot: (...args: unknown[]) => useConfirmSlotMock(...args),
  useCounterRequest: (...args: unknown[]) => useCounterRequestMock(...args),
  useInterview: (...args: unknown[]) => useInterviewMock(...args),
  ProposeSlotsForm: () => <div>Propose slots form</div>,
}));

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
    slots,
    ...overrides,
  };
}

describe("ProposalCard", () => {
  beforeEach(() => {
    useConfirmSlotMock.mockReset();
    useCounterRequestMock.mockReset();
    useInterviewMock.mockReset();
    useConfirmSlotMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    });
    useCounterRequestMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    });
    useInterviewMock.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    });
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
    useInterviewMock.mockReturnValue({
      data: {
        id: "interview-1",
        jobId: "job-1",
        candidateId: "cand-1",
        interviewType: "video",
        status: "scheduled",
        round: 1,
        confirmedSlotStart: "2026-09-01T16:00:00.000Z",
        confirmedSlotEnd: "2026-09-01T17:00:00.000Z",
        meetingJoinUrl: null,
        outcome: null,
        passFeedback: null,
        createdAt: "2026-08-01T00:00:00.000Z",
      },
      isPending: false,
      isError: false,
    });

    renderWithProviders(
      <ProposalCard
        title="Interview time confirmed"
        note={null}
        data={proposalData({ proposalStatus: "confirmed" })}
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
});

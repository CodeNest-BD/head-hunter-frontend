import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { format, subDays } from "date-fns";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import type { Offer } from "@/features/offers/schemas";
import type { CandidateNegotiationState } from "@/features/conversations/utils/candidateNegotiationState";
import { SendOfferForm } from "./SendOfferForm";

const fetchOffersMock = vi.fn();
const createOfferMock = vi.fn();

// `fetchOffers` is mocked only so a stray call would be caught, not because
// the component still uses it — it reads its candidate's negotiation state
// from a prop instead of mounting its own offers query.
vi.mock("@/features/offers/api/offers", () => ({
  fetchOffers: (...args: unknown[]) => fetchOffersMock(...args),
  createOffer: (...args: unknown[]) => createOfferMock(...args),
}));

function offer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: "offer-1",
    candidateId: "candidate-1",
    jobId: "job-1",
    previousOfferId: null,
    createdBy: "company",
    amountMinor: 500000,
    status: "sent",
    placementDetails: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

function negotiationState(
  overrides: Partial<CandidateNegotiationState> = {},
): CandidateNegotiationState {
  return {
    interview: null,
    offer: null,
    interviewRecord: null,
    offerRecord: null,
    ...overrides,
  };
}

describe("SendOfferForm", () => {
  beforeEach(() => {
    fetchOffersMock.mockReset();
    createOfferMock.mockReset();
    vi.setSystemTime(new Date("2026-08-22T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reads the negotiation state it is given instead of fetching its own", async () => {
    renderWithProviders(
      <SendOfferForm
        candidateId="candidate-1"
        negotiationState={negotiationState()}
      />,
    );

    await screen.findByRole("button", { name: /send offer/i });
    expect(fetchOffersMock).not.toHaveBeenCalled();
  });

  it("disables sending an offer with a readable reason when the candidate already has one awaiting a response", async () => {
    renderWithProviders(
      <SendOfferForm
        candidateId="candidate-1"
        negotiationState={negotiationState({
          offer: { kind: "sent", salaryMinor: null },
        })}
      />,
    );

    expect(
      await screen.findByRole("button", { name: /send offer/i }),
    ).toBeDisabled();
    expect(
      screen.getByText(/already has an offer awaiting a response/i),
    ).toBeInTheDocument();
  });

  it("disables sending an offer with a readable reason when the candidate has already been hired", async () => {
    renderWithProviders(
      <SendOfferForm
        candidateId="candidate-1"
        negotiationState={negotiationState({
          offer: { kind: "accepted", salaryMinor: null },
        })}
      />,
    );

    expect(
      await screen.findByRole("button", { name: /send offer/i }),
    ).toBeDisabled();
    expect(screen.getByText(/already been hired/i)).toBeInTheDocument();
  });

  it("enables sending an offer when the candidate has neither a live nor an accepted offer", async () => {
    renderWithProviders(
      <SendOfferForm
        candidateId="candidate-1"
        negotiationState={negotiationState({
          offer: { kind: "declined", salaryMinor: null },
        })}
      />,
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /send offer/i })).toBeEnabled(),
    );
    expect(screen.queryByText(/already has an offer/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/already been hired/i)).not.toBeInTheDocument();
  });

  it("converts the entered salary to minor units and sends optional fields on submit", async () => {
    createOfferMock.mockResolvedValue(offer());
    const user = userEvent.setup();

    renderWithProviders(
      <SendOfferForm
        candidateId="candidate-1"
        negotiationState={negotiationState()}
      />,
    );

    await user.click(
      await screen.findByRole("button", { name: /send offer/i }),
    );
    await user.type(screen.getByLabelText(/salary/i), "150000");
    await user.type(screen.getByLabelText(/notes/i), "Relocation covered.");
    await user.click(screen.getByRole("button", { name: /^send offer$/i }));

    await waitFor(() => {
      expect(createOfferMock).toHaveBeenCalledWith(
        expect.objectContaining({
          candidateId: "candidate-1",
          salaryMinor: 15000000,
          notes: "Relocation covered.",
        }),
      );
    });
  });

  it("asks for no job title — the offer already belongs to one job", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <SendOfferForm
        candidateId="candidate-1"
        negotiationState={negotiationState()}
      />,
    );

    await user.click(
      await screen.findByRole("button", { name: /send offer/i }),
    );

    expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();
  });

  it("does not let the user choose a start date before today", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <SendOfferForm
        candidateId="candidate-1"
        negotiationState={negotiationState()}
      />,
    );

    await user.click(
      await screen.findByRole("button", { name: /send offer/i }),
    );
    // The trigger is a button associated with a `<label for>`, so its
    // accessible name is the label ("Start date"), not its own visible text —
    // same reasoning as `ProposeSlotsForm.test.tsx`'s day-picker trigger.
    await user.click(screen.getByText(/pick a start date/i));

    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const cell = document.querySelector<HTMLButtonElement>(
      `[data-day="${yesterday}"] button`,
    );
    expect(cell).not.toBeNull();
    expect(cell).toBeDisabled();
  });

  it("rejects a start date that has gone stale by the time the offer is submitted", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <SendOfferForm
        candidateId="candidate-1"
        negotiationState={negotiationState()}
      />,
    );

    await user.click(
      await screen.findByRole("button", { name: /send offer/i }),
    );
    await user.click(screen.getByText(/pick a start date/i));

    const today = format(new Date(), "yyyy-MM-dd");
    const todayCell = document.querySelector<HTMLButtonElement>(
      `[data-day="${today}"] button`,
    );
    if (!todayCell) {
      throw new Error(`today (${today}) is not rendered in the calendar`);
    }
    await user.click(todayCell);

    // The form stays open past the picked date's one-day slack window before
    // the user gets around to submitting it.
    vi.setSystemTime(new Date("2026-08-25T12:00:00"));

    await user.type(screen.getByLabelText(/salary/i), "150000");
    await user.click(screen.getByRole("button", { name: /^send offer$/i }));

    expect(
      await screen.findByText(/pick a start date of today or later/i),
    ).toBeInTheDocument();
    expect(createOfferMock).not.toHaveBeenCalled();
  });

  it("requires a salary before it will submit", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <SendOfferForm
        candidateId="candidate-1"
        negotiationState={negotiationState()}
      />,
    );

    await user.click(
      await screen.findByRole("button", { name: /send offer/i }),
    );
    await user.click(screen.getByRole("button", { name: /^send offer$/i }));

    expect(await screen.findByText(/salary is required/i)).toBeInTheDocument();
    expect(createOfferMock).not.toHaveBeenCalled();
  });
});

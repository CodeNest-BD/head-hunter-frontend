import { fireEvent, screen, waitFor } from "@testing-library/react";
import { format } from "date-fns";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import { ApiError } from "@/shared/libs/errorHandler";
import {
  formatMinor,
  MAX_MONEY_MAJOR,
  MAX_MONEY_MAJOR_LABEL,
} from "@/shared/utils/money";
import { OfferCard, type OfferEventData } from "./OfferCard";

const useAcceptOfferMock = vi.fn();
const useDeclineOfferMock = vi.fn();
const useCounterOfferMock = vi.fn();
const useWithdrawOfferMock = vi.fn();
const useSendMessageMock = vi.fn();

vi.mock("../hooks/useConversation", () => ({
  useSendMessage: (...args: unknown[]) => useSendMessageMock(...args),
}));

vi.mock("@/features/offers", () => ({
  useAcceptOffer: (...args: unknown[]) => useAcceptOfferMock(...args),
  useDeclineOffer: (...args: unknown[]) => useDeclineOfferMock(...args),
  useCounterOffer: (...args: unknown[]) => useCounterOfferMock(...args),
  useWithdrawOffer: (...args: unknown[]) => useWithdrawOfferMock(...args),
}));

function mutationStub() {
  return { mutate: vi.fn(), isPending: false, isError: false, error: null };
}

function offerData(overrides: Partial<OfferEventData> = {}): OfferEventData {
  return {
    kind: "offer",
    offerId: "offer-1",
    offerStatus: "sent",
    amountMinor: 500000,
    salaryMinor: 13000000,
    jobTitle: "Staff Engineer",
    startDate: "2026-09-01",
    previousOfferId: null,
    createdBy: "company",
    companyCanCoverFee: null,
    ...overrides,
  };
}

describe("OfferCard", () => {
  beforeEach(() => {
    useAcceptOfferMock.mockReset();
    useDeclineOfferMock.mockReset();
    useCounterOfferMock.mockReset();
    useWithdrawOfferMock.mockReset();
    useAcceptOfferMock.mockReturnValue(mutationStub());
    useDeclineOfferMock.mockReturnValue(mutationStub());
    useCounterOfferMock.mockReturnValue(mutationStub());
    useWithdrawOfferMock.mockReturnValue(mutationStub());
    useSendMessageMock.mockReset();
    useSendMessageMock.mockReturnValue(mutationStub());
  });

  it("renders the negotiated salary formatted", () => {
    renderWithProviders(
      <OfferCard
        data={offerData()}
        viewerParty="recruiter"
        candidateId="candidate-1"
      />,
    );

    expect(screen.getByText(formatMinor(13000000))).toBeInTheDocument();
  });

  it("shows the fixed commission as the recruiter's own fee, distinct from the salary and never as an input", () => {
    renderWithProviders(
      <OfferCard
        data={offerData()}
        viewerParty="recruiter"
        candidateId="candidate-1"
      />,
    );

    // The recruiter earns it, so from their view it reads as "Your fee".
    expect(screen.getByText("Your fee")).toBeInTheDocument();
    expect(screen.getByText("fixed")).toBeInTheDocument();
    expect(screen.getByText(formatMinor(500000))).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(document.querySelector("input")).not.toBeInTheDocument();
  });

  it("offers Accept, Decline and Counter to the party who did not create a sent offer", () => {
    renderWithProviders(
      <OfferCard
        data={offerData({ createdBy: "company", offerStatus: "sent" })}
        viewerParty="recruiter"
        candidateId="candidate-1"
      />,
    );

    expect(
      screen.getByRole("button", { name: /^accept$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^decline$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^counter$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /withdraw/i }),
    ).not.toBeInTheDocument();
  });

  it("offers only Withdraw to the creator of a sent offer", () => {
    renderWithProviders(
      <OfferCard
        data={offerData({ createdBy: "company", offerStatus: "sent" })}
        viewerParty="company"
        candidateId="candidate-1"
      />,
    );

    expect(
      screen.getByRole("button", { name: /^withdraw$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^accept$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^decline$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^counter$/i }),
    ).not.toBeInTheDocument();
  });

  it("warns the creator that withdrawing restores the candidate's previous status, then withdraws on confirm", () => {
    const withdrawMutate = vi.fn();
    useWithdrawOfferMock.mockReturnValue({
      mutate: withdrawMutate,
      isPending: false,
      isError: false,
      error: null,
    });

    renderWithProviders(
      <OfferCard
        data={offerData({ createdBy: "company", offerStatus: "sent" })}
        viewerParty="company"
        candidateId="candidate-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^withdraw$/i }));
    expect(
      screen.getByText(/back to their previous status/i),
    ).toBeInTheDocument();
    expect(withdrawMutate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /confirm withdraw/i }));
    expect(withdrawMutate).toHaveBeenCalled();
  });

  it("cancels the withdraw confirmation without calling the mutation", () => {
    const withdrawMutate = vi.fn();
    useWithdrawOfferMock.mockReturnValue({
      mutate: withdrawMutate,
      isPending: false,
      isError: false,
      error: null,
    });

    renderWithProviders(
      <OfferCard
        data={offerData({ createdBy: "company", offerStatus: "sent" })}
        viewerParty="company"
        candidateId="candidate-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^withdraw$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(withdrawMutate).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /^withdraw$/i }),
    ).toBeInTheDocument();
  });

  it("leaves the withdraw confirmation open and shows an error when withdrawal fails", () => {
    useWithdrawOfferMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: new ApiError("This offer is no longer awaiting a response.", {
        statusCode: 409,
      }),
    });

    renderWithProviders(
      <OfferCard
        data={offerData({ createdBy: "company", offerStatus: "sent" })}
        viewerParty="company"
        candidateId="candidate-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^withdraw$/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm withdraw/i }));

    expect(
      screen.getByRole("button", { name: /confirm withdraw/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no longer awaiting a response/i),
    ).toBeInTheDocument();
  });

  it.each(["accepted", "declined", "countered", "superseded"] as const)(
    "shows no action buttons once the offer is %s",
    (offerStatus) => {
      renderWithProviders(
        <OfferCard
          data={offerData({ offerStatus, createdBy: "company" })}
          viewerParty="recruiter"
          candidateId="candidate-1"
        />,
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    },
  );

  it("shows no action buttons for the creator once the offer is no longer sent", () => {
    renderWithProviders(
      <OfferCard
        data={offerData({ offerStatus: "accepted", createdBy: "company" })}
        viewerParty="company"
        candidateId="candidate-1"
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("indicates this entry is a counter to a previous offer", () => {
    renderWithProviders(
      <OfferCard
        data={offerData({ previousOfferId: "offer-0" })}
        viewerParty="recruiter"
        candidateId="candidate-1"
      />,
    );

    expect(screen.getByText(/counters a previous offer/i)).toBeInTheDocument();
  });

  it("does not indicate a counter when there is no previous offer", () => {
    renderWithProviders(
      <OfferCard
        data={offerData({ previousOfferId: null })}
        viewerParty="recruiter"
        candidateId="candidate-1"
      />,
    );

    expect(
      screen.queryByText(/counters a previous offer/i),
    ).not.toBeInTheDocument();
  });

  it("lets the counterparty open a counter form and submit a new salary", async () => {
    const counterMutate = vi.fn();
    useCounterOfferMock.mockReturnValue({
      mutate: counterMutate,
      isPending: false,
      isError: false,
      error: null,
    });

    renderWithProviders(
      <OfferCard
        data={offerData({ createdBy: "company" })}
        viewerParty="recruiter"
        candidateId="candidate-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^counter$/i }));
    fireEvent.change(screen.getByLabelText(/new salary/i), {
      target: { value: "150000" },
    });
    fireEvent.click(screen.getByText(/pick a start date/i));
    const today = format(new Date(), "yyyy-MM-dd");
    const todayCell = document.querySelector<HTMLButtonElement>(
      `[data-day="${today}"] button`,
    );
    if (!todayCell) {
      throw new Error(`today (${today}) is not rendered in the calendar`);
    }
    fireEvent.click(todayCell);
    fireEvent.click(screen.getByRole("button", { name: /send counter/i }));

    await waitFor(() =>
      expect(counterMutate).toHaveBeenCalledWith(
        expect.objectContaining({ salaryMinor: 15000000, startDate: today }),
        expect.anything(),
      ),
    );
  });

  // The counter is the same money field in the same negotiation as the opening
  // offer, and the backend bounds it identically — so it is held to the same
  // rules, with the same readable copy, rather than being left open.
  it("refuses a counter salary above the platform ceiling, and says so", async () => {
    const counterMutate = vi.fn();
    useCounterOfferMock.mockReturnValue({
      mutate: counterMutate,
      isPending: false,
      isError: false,
      error: null,
    });

    renderWithProviders(
      <OfferCard
        data={offerData({ createdBy: "company" })}
        viewerParty="recruiter"
        candidateId="candidate-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^counter$/i }));
    fireEvent.change(screen.getByLabelText(/new salary/i), {
      target: { value: String(MAX_MONEY_MAJOR + 1) },
    });
    fireEvent.click(screen.getByRole("button", { name: /send counter/i }));

    expect(
      await screen.findByText(`Salary must be under ${MAX_MONEY_MAJOR_LABEL}`),
    ).toBeInTheDocument();
    expect(counterMutate).not.toHaveBeenCalled();
  });

  it("refuses a counter with no salary at all, and says so", async () => {
    const counterMutate = vi.fn();
    useCounterOfferMock.mockReturnValue({
      mutate: counterMutate,
      isPending: false,
      isError: false,
      error: null,
    });

    renderWithProviders(
      <OfferCard
        data={offerData({ createdBy: "company" })}
        viewerParty="recruiter"
        candidateId="candidate-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^counter$/i }));
    fireEvent.click(screen.getByRole("button", { name: /send counter/i }));

    expect(await screen.findByText("Salary is required")).toBeInTheDocument();
    expect(counterMutate).not.toHaveBeenCalled();
  });

  it("keeps past days off the counter's start-date calendar", async () => {
    vi.setSystemTime(new Date("2026-08-22T12:00:00"));

    renderWithProviders(
      <OfferCard
        data={offerData({ createdBy: "company" })}
        viewerParty="recruiter"
        candidateId="candidate-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^counter$/i }));
    // A free-text date input let any past day through; the shared day field
    // renders a calendar with everything before today disabled.
    fireEvent.click(screen.getByText(/pick a start date/i));

    const yesterday = document.querySelector<HTMLButtonElement>(
      '[data-day="2026-08-21"] button',
    );
    expect(yesterday).toBeDisabled();
    const today = document.querySelector<HTMLButtonElement>(
      '[data-day="2026-08-22"] button',
    );
    expect(today).toBeEnabled();

    vi.useRealTimers();
  });

  // Accepting is what holds the fee in escrow, so an offer the company can no
  // longer fund would be refused server-side — the recruiter is told before
  // the click instead of by a 409 after it.
  describe("when the company can no longer cover the fee", () => {
    const unfunded = () => offerData({ companyCanCoverFee: false });

    it("blocks Accept and says why", () => {
      renderWithProviders(
        <OfferCard
          data={unfunded()}
          viewerParty="recruiter"
          candidateId="candidate-1"
        />,
      );

      expect(screen.getByRole("button", { name: "Accept" })).toBeDisabled();
      expect(
        screen.getByText("The company has not enough balance to proceed."),
      ).toBeInTheDocument();
    });

    it("sends the company a message saying so", () => {
      const mutate = vi.fn();
      useSendMessageMock.mockReturnValue({ ...mutationStub(), mutate });

      renderWithProviders(
        <OfferCard
          data={unfunded()}
          viewerParty="recruiter"
          candidateId="candidate-1"
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Notify Company" }));

      expect(useSendMessageMock).toHaveBeenCalledWith(
        "candidate-1",
        "recruiter",
      );
      expect(mutate).toHaveBeenCalledWith({
        body: "I cannot accept your offer due to your lack of balance.",
      });
    });

    it("leaves Accept alone when funding was not reported", () => {
      renderWithProviders(
        <OfferCard
          data={offerData({ companyCanCoverFee: null })}
          viewerParty="recruiter"
          candidateId="candidate-1"
        />,
      );

      expect(screen.getByRole("button", { name: "Accept" })).toBeEnabled();
      expect(
        screen.queryByRole("button", { name: "Notify Company" }),
      ).not.toBeInTheDocument();
    });
  });
});

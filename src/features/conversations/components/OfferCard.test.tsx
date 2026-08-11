import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import { formatMinor } from "@/shared/utils/money";
import { OfferCard, type OfferEventData } from "./OfferCard";

const useAcceptOfferMock = vi.fn();
const useDeclineOfferMock = vi.fn();
const useCounterOfferMock = vi.fn();
const useWithdrawOfferMock = vi.fn();

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
  });

  it("renders the negotiated salary formatted", () => {
    renderWithProviders(
      <OfferCard data={offerData()} viewerParty="recruiter" />,
    );

    expect(screen.getByText(formatMinor(13000000))).toBeInTheDocument();
  });

  it("labels the commission as the recruiter's fee, distinct from the salary and never as an input", () => {
    renderWithProviders(
      <OfferCard data={offerData()} viewerParty="recruiter" />,
    );

    expect(screen.getByText(/recruiter's fee/i)).toBeInTheDocument();
    expect(screen.getByText(formatMinor(500000))).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(document.querySelector("input")).not.toBeInTheDocument();
  });

  it("offers Accept, Decline and Counter to the party who did not create a sent offer", () => {
    renderWithProviders(
      <OfferCard
        data={offerData({ createdBy: "company", offerStatus: "sent" })}
        viewerParty="recruiter"
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

  it.each(["accepted", "declined", "countered", "superseded"] as const)(
    "shows no action buttons once the offer is %s",
    (offerStatus) => {
      renderWithProviders(
        <OfferCard
          data={offerData({ offerStatus, createdBy: "company" })}
          viewerParty="recruiter"
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
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("indicates this entry is a counter to a previous offer", () => {
    renderWithProviders(
      <OfferCard
        data={offerData({ previousOfferId: "offer-0" })}
        viewerParty="recruiter"
      />,
    );

    expect(screen.getByText(/counters a previous offer/i)).toBeInTheDocument();
  });

  it("does not indicate a counter when there is no previous offer", () => {
    renderWithProviders(
      <OfferCard
        data={offerData({ previousOfferId: null })}
        viewerParty="recruiter"
      />,
    );

    expect(
      screen.queryByText(/counters a previous offer/i),
    ).not.toBeInTheDocument();
  });

  it("lets the counterparty open a counter form and submit a new salary", () => {
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
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^counter$/i }));
    fireEvent.change(screen.getByLabelText(/new salary/i), {
      target: { value: "150000" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send counter/i }));

    expect(counterMutate).toHaveBeenCalledWith(
      expect.objectContaining({ salaryMinor: 15000000 }),
      expect.anything(),
    );
  });
});

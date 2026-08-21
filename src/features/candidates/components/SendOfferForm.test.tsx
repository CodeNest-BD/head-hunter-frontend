import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import type { Offer } from "@/features/offers/schemas";
import { SendOfferForm } from "./SendOfferForm";

const fetchOffersMock = vi.fn();
const createOfferMock = vi.fn();

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

describe("SendOfferForm", () => {
  beforeEach(() => {
    fetchOffersMock.mockReset();
    createOfferMock.mockReset();
  });

  it("disables sending an offer with a readable reason when the candidate already has one awaiting a response", async () => {
    fetchOffersMock.mockResolvedValue({
      data: [offer({ status: "sent" })],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });

    renderWithProviders(<SendOfferForm candidateId="candidate-1" />);

    expect(
      await screen.findByRole("button", { name: /send offer/i }),
    ).toBeDisabled();
    expect(
      screen.getByText(/already has an offer awaiting a response/i),
    ).toBeInTheDocument();
  });

  it("disables sending an offer with a readable reason when the candidate has already been hired", async () => {
    fetchOffersMock.mockResolvedValue({
      data: [offer({ status: "accepted" })],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });

    renderWithProviders(<SendOfferForm candidateId="candidate-1" />);

    expect(
      await screen.findByRole("button", { name: /send offer/i }),
    ).toBeDisabled();
    expect(screen.getByText(/already been hired/i)).toBeInTheDocument();
  });

  it("enables sending an offer when the candidate has neither a live nor an accepted offer", async () => {
    fetchOffersMock.mockResolvedValue({
      data: [offer({ status: "declined" })],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });

    renderWithProviders(<SendOfferForm candidateId="candidate-1" />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /send offer/i })).toBeEnabled(),
    );
    expect(screen.queryByText(/already has an offer/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/already been hired/i)).not.toBeInTheDocument();
  });

  it("converts the entered salary to minor units and sends optional fields on submit", async () => {
    fetchOffersMock.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
    });
    createOfferMock.mockResolvedValue(offer());
    const user = userEvent.setup();

    renderWithProviders(<SendOfferForm candidateId="candidate-1" />);

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

    renderWithProviders(<SendOfferForm candidateId="candidate-1" />);

    await user.click(
      await screen.findByRole("button", { name: /send offer/i }),
    );

    expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();
  });

  it("requires a salary before it will submit", async () => {
    fetchOffersMock.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
    });
    const user = userEvent.setup();

    renderWithProviders(<SendOfferForm candidateId="candidate-1" />);

    await user.click(
      await screen.findByRole("button", { name: /send offer/i }),
    );
    await user.click(screen.getByRole("button", { name: /^send offer$/i }));

    expect(await screen.findByText(/salary is required/i)).toBeInTheDocument();
    expect(createOfferMock).not.toHaveBeenCalled();
  });
});

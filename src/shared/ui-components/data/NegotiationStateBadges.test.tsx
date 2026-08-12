import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { formatDateTime } from "@/shared/utils/formatDate";
import { NegotiationStateBadges } from "./NegotiationStateBadges";

describe("NegotiationStateBadges", () => {
  it("shows an explicit empty state for both rows when nothing has happened yet", () => {
    render(<NegotiationStateBadges interview={null} offer={null} />);

    expect(screen.getByText(/Interview:/)).toHaveTextContent(
      "Interview: none yet",
    );
    expect(screen.getByText(/Offer:/)).toHaveTextContent("Offer: none yet");
  });

  it("shows awaiting a time for an interview with no confirmed slot yet", () => {
    render(
      <NegotiationStateBadges
        interview={{ kind: "awaiting_time" }}
        offer={null}
      />,
    );

    expect(screen.getByText(/Interview:/)).toHaveTextContent(
      "Interview: awaiting a time",
    );
  });

  it("shows the confirmed time once a slot has been confirmed", () => {
    render(
      <NegotiationStateBadges
        interview={{
          kind: "scheduled",
          confirmedSlotStart: "2026-09-01T16:00:00.000Z",
          confirmedSlotEnd: "2026-09-01T17:00:00.000Z",
        }}
        offer={null}
      />,
    );

    const expected = formatDateTime("2026-09-01T16:00:00.000Z");
    expect(screen.getByText(/Interview:/)).toHaveTextContent(
      `Interview: scheduled ${expected}`,
    );
  });

  it("shows the offer sent state with its salary", () => {
    render(
      <NegotiationStateBadges
        interview={null}
        offer={{ kind: "sent", salaryMinor: 13000000 }}
      />,
    );

    expect(screen.getByText(/Offer:/)).toHaveTextContent(
      "Offer: offer sent · $130,000",
    );
  });

  it("shows an accepted offer without a salary figure when none was recorded", () => {
    render(
      <NegotiationStateBadges
        interview={null}
        offer={{ kind: "accepted", salaryMinor: null }}
      />,
    );

    expect(screen.getByText(/Offer:/)).toHaveTextContent("Offer: accepted");
  });

  it("never renders a superseded offer, because the type has no such state", () => {
    render(
      <NegotiationStateBadges
        interview={null}
        offer={{ kind: "countered", salaryMinor: 9000000 }}
      />,
    );

    expect(screen.queryByText(/superseded/i)).not.toBeInTheDocument();
  });
});

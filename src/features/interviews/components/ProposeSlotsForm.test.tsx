import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import { MAX_PROPOSAL_SLOTS } from "../schemas";
import { ProposeSlotsForm } from "./ProposeSlotsForm";

const mutateMock = vi.fn();

// Only the mutation is stubbed. Stubbing it also keeps `../api/interviews` —
// which reads NEXT_PUBLIC_API_URL at import time — out of this test.
vi.mock("../hooks/useInterviews", () => ({
  useProposeSlots: () => ({
    mutate: mutateMock,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

/**
 * Opens the day popover and picks the last selectable day shown, which is in
 * the future regardless of when the suite runs. The trigger is found by its
 * visible text rather than its role name: it is a button associated with a
 * `<label for>`, so the computed accessible name is the label, not the text.
 */
async function pickADay(): Promise<void> {
  await userEvent.click(screen.getByText(/pick a day/i));
  // Day cells are plain buttons labelled with the day number in this
  // react-day-picker version, so they are matched on that rather than an
  // attribute. Disabled ones are past days.
  const days = Array.from(
    document.querySelectorAll<HTMLButtonElement>("button"),
  ).filter(
    (button) =>
      !button.disabled && /^\d{1,2}$/.test((button.textContent ?? "").trim()),
  );
  expect(days.length).toBeGreaterThan(0);
  await userEvent.click(days[days.length - 1]);
}

function renderForm() {
  return renderWithProviders(
    <ProposeSlotsForm interviewId="interview-1" onDone={vi.fn()} />,
  );
}

describe("ProposeSlotsForm", () => {
  beforeEach(() => {
    mutateMock.mockReset();
  });

  it("offers no times until a day is chosen", () => {
    renderForm();

    expect(screen.queryByText(/start times on/i)).not.toBeInTheDocument();
  });

  it("cannot be submitted with nothing selected", () => {
    renderForm();

    expect(
      screen.getByRole("button", { name: "Propose times" }),
    ).toBeDisabled();
  });

  it("adds the chosen start time to the offer, and removes it from the list", async () => {
    renderForm();
    await pickADay();

    // 9:00 AM is the default selection, so adding needs no dropdown change.
    await userEvent.click(screen.getByRole("button", { name: /add time/i }));
    expect(
      screen.getByText(`1 of ${MAX_PROPOSAL_SLOTS} selected`),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^Remove / }));
    expect(
      screen.getByText(`0 of ${MAX_PROPOSAL_SLOTS} selected`),
    ).toBeInTheDocument();
  });

  it("will not offer the same time twice", async () => {
    renderForm();
    await pickADay();

    await userEvent.click(screen.getByRole("button", { name: /add time/i }));

    expect(screen.getByText("Already offered")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add time/i })).toBeDisabled();
  });

  it("applies a length change to times already chosen, so the batch stays consistent", async () => {
    renderForm();
    await pickADay();
    await userEvent.click(screen.getByRole("button", { name: /add time/i }));

    // 60 min is the default, so the window ends at 10:00.
    expect(screen.getByText(/9:00 AM – 10:00 AM/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "30 min" }));

    expect(screen.getByText(/9:00 AM – 9:30 AM/)).toBeInTheDocument();
  });

  it("submits every chosen window as a start/end pair", async () => {
    renderForm();
    await pickADay();
    await userEvent.click(screen.getByRole("button", { name: /add time/i }));

    fireEvent.submit(screen.getByRole("button", { name: "Propose times" }));

    await vi.waitFor(() => expect(mutateMock).toHaveBeenCalled());
    const [payload] = mutateMock.mock.calls[0];
    expect(payload.slots).toHaveLength(1);
    expect(payload.slots[0]).toEqual(
      expect.objectContaining({
        startAt: expect.any(String),
        endAt: expect.any(String),
      }),
    );
  });
});

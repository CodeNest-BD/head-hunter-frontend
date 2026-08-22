import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { format } from "date-fns";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

/**
 * Opens the day popover and picks today's cell specifically, identified by
 * react-day-picker's `data-day="yyyy-MM-dd"` attribute rather than position —
 * so it stays correct under a faked system time, unlike `pickADay`, which
 * only ever needs "some future day".
 */
async function pickToday(): Promise<void> {
  await userEvent.click(screen.getByText(/pick a day/i));
  const iso = format(new Date(), "yyyy-MM-dd");
  const cell = document.querySelector<HTMLButtonElement>(
    `[data-day="${iso}"] button`,
  );
  if (!cell) {
    throw new Error(`today (${iso}) is not rendered in the calendar`);
  }
  await userEvent.click(cell);
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

  afterEach(() => {
    vi.useRealTimers();
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

    expect(
      screen.getByText("That time is already offered"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add time/i })).toBeDisabled();
  });

  it("applies a length change to times already chosen, so the batch stays consistent", async () => {
    renderForm();
    await pickADay();
    await userEvent.click(screen.getByRole("button", { name: /add time/i }));

    // 60 min is the default, so the window ends at 10:00.
    expect(screen.getByText(/9:00 AM – 10:00 AM/)).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Length"), "30");

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

  it("submits the currently picked time without requiring Add time", async () => {
    renderForm();
    await pickADay();

    // `fireEvent.submit` is used deliberately below: it proves the pick is
    // staged before validation runs, which a click cannot isolate. The button
    // must also genuinely be clickable in this state, or that would pass on a
    // form no user could actually submit.
    expect(screen.getByRole("button", { name: "Propose times" })).toBeEnabled();

    // No "Add time" click — the day + default 9:00 AM pick alone is submitted.
    fireEvent.submit(screen.getByRole("button", { name: "Propose times" }));

    await vi.waitFor(() => expect(mutateMock).toHaveBeenCalled());
    const [payload] = mutateMock.mock.calls[0];
    expect(payload.slots).toHaveLength(1);
  });

  it("submits the five already chosen when a sixth time is showing in the dropdown", async () => {
    renderForm();
    await pickADay();

    const startTime = screen.getByLabelText("Start time");
    // 9:00 AM is already selected, so the first Add needs no change; every
    // later one has to move the dropdown, since a duplicate cannot be added.
    for (const time of ["09:00", "10:00", "11:00", "12:00", "13:00"]) {
      await userEvent.selectOptions(startTime, time);
      await userEvent.click(screen.getByRole("button", { name: /add time/i }));
    }
    expect(
      screen.getByText(
        `${MAX_PROPOSAL_SLOTS} of ${MAX_PROPOSAL_SLOTS} selected`,
      ),
    ).toBeInTheDocument();

    // A sixth, un-added time left showing in the dropdown must not be staged
    // by the submit: the batch is full, and appending it would push the form
    // past the schema's max with nothing the user could do to recover.
    await userEvent.selectOptions(startTime, "14:00");
    await userEvent.click(
      screen.getByRole("button", { name: "Propose times" }),
    );

    await vi.waitFor(() => expect(mutateMock).toHaveBeenCalledTimes(1));
    const [payload] = mutateMock.mock.calls[0];
    expect(payload.slots).toHaveLength(MAX_PROPOSAL_SLOTS);
    expect(
      screen.getByText(
        `${MAX_PROPOSAL_SLOTS} of ${MAX_PROPOSAL_SLOTS} selected`,
      ),
    ).toBeInTheDocument();
  });

  it("refuses an empty batch and names the minimum instead of submitting it", async () => {
    renderForm();

    // No day picked, so there is nothing to stage and the array-level minimum
    // is the only rule that can fail — what this pins is that its message
    // reaches the user and nothing is sent, not which key it arrives under.
    fireEvent.submit(screen.getByRole("button", { name: "Propose times" }));

    expect(
      await screen.findByText("Propose at least 1 time"),
    ).toBeInTheDocument();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it("does not offer a start time that has already passed today", async () => {
    vi.setSystemTime(new Date("2026-08-22T14:30:00"));
    renderForm();
    await pickToday();

    const options = Array.from(
      screen.getByLabelText("Start time").querySelectorAll("option"),
    ).map((option) => option.value);

    expect(options).not.toContain("09:00");
    expect(options).not.toContain("14:00");
    expect(options).toContain("15:00");
    expect(screen.getByLabelText("Start time")).not.toHaveValue("09:00");
  });

  it("says so when no times are left today", async () => {
    vi.setSystemTime(new Date("2026-08-22T23:59:00"));
    renderForm();
    await pickToday();

    expect(
      screen.getByText("No times left today — pick another day."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Start time")).toBeDisabled();
    expect(screen.getByRole("button", { name: /add time/i })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Propose times" }),
    ).toBeDisabled();
  });
});

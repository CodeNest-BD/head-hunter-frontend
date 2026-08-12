import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DaySeparator } from "./DaySeparator";

describe("DaySeparator", () => {
  it('labels a date matching the injected "now" as Today', () => {
    render(
      <DaySeparator
        date="2026-08-12T09:00:00.000Z"
        now={new Date("2026-08-12T15:00:00.000Z")}
      />,
    );

    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it('labels the calendar day before the injected "now" as Yesterday', () => {
    render(
      <DaySeparator
        date="2026-08-11T09:00:00.000Z"
        now={new Date("2026-08-12T15:00:00.000Z")}
      />,
    );

    expect(screen.getByText("Yesterday")).toBeInTheDocument();
  });

  it("renders a plain date for anything older than yesterday", () => {
    render(
      <DaySeparator
        date="2026-08-01T09:00:00.000Z"
        now={new Date("2026-08-12T15:00:00.000Z")}
      />,
    );

    expect(screen.getByText("August 1, 2026")).toBeInTheDocument();
  });

  it("renders a plain fallback instead of throwing for a malformed timestamp", () => {
    expect(() =>
      render(
        <DaySeparator
          date="not-a-real-date"
          now={new Date("2026-08-12T15:00:00.000Z")}
        />,
      ),
    ).not.toThrow();

    expect(screen.getByText("Invalid Date")).toBeInTheDocument();
  });
});

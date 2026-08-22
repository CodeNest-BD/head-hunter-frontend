import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import type { PublicJobMapEntry } from "@/features/jobs/publicSchemas";

const usePublicJobMapMock = vi.fn();
vi.mock("@/features/jobs/hooks/usePublicJobs", () => ({
  usePublicJobMap: () => usePublicJobMapMock(),
}));

import { DecorativeUsMap } from "./DecorativeUsMap";

const rows: PublicJobMapEntry[] = [
  {
    locationState: "NY",
    locationCity: "New York",
    openRoles: 3,
    averageFeeMinor: 50_000,
  },
  {
    locationState: "CA",
    locationCity: "San Francisco",
    openRoles: 5,
    averageFeeMinor: 80_000,
  },
  // Unmatchable free-text city — must be skipped, not crash.
  {
    locationState: "12",
    locationCity: "sd1232121",
    openRoles: 1,
    averageFeeMinor: 0,
  },
];

describe("DecorativeUsMap", () => {
  it("renders a bubble per placeable city with its live count", () => {
    usePublicJobMapMock.mockReturnValue({ data: rows });

    renderWithProviders(<DecorativeUsMap />);

    // City labels for the two matchable cities.
    expect(screen.getByText("New York")).toBeInTheDocument();
    expect(screen.getByText("San Francisco")).toBeInTheDocument();
    // Their live counts render inside the bubbles.
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    // The garbage city is dropped.
    expect(screen.queryByText("sd1232121")).not.toBeInTheDocument();
  });

  it("renders no bubbles (but doesn't crash) before data loads", () => {
    usePublicJobMapMock.mockReturnValue({ data: undefined });

    renderWithProviders(<DecorativeUsMap />);

    expect(screen.queryByText("New York")).not.toBeInTheDocument();
  });
});

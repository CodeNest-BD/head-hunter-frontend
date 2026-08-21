import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useAuthMock = vi.fn();
vi.mock("@/features/auth", () => ({
  useAuth: () => useAuthMock(),
}));

// Both shells stand in for themselves: this file is about which one wraps the
// page, not what either renders.
vi.mock("@/shared/ui-components/layout/DashboardLayout", () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}));
vi.mock("@/components/landing/PublicShell", () => ({
  PublicShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="public-shell">{children}</div>
  ),
}));
vi.mock("./ExploreJobsView", () => ({
  ExploreJobsView: () => <div data-testid="explore-view" />,
}));

// Imported after the mocks so the module graph picks them up.
import { ExploreJobsShell } from "./ExploreJobsShell";

describe("ExploreJobsShell", () => {
  it("gives a signed-in recruiter their sidebar, so the job map is not a dead end", () => {
    useAuthMock.mockReturnValue({
      status: "authenticated",
      user: { role: "recruiter" },
    });

    render(<ExploreJobsShell />);

    expect(screen.getByTestId("dashboard-shell")).toBeInTheDocument();
    expect(screen.queryByTestId("public-shell")).not.toBeInTheDocument();
    expect(screen.getByTestId("explore-view")).toBeInTheDocument();
  });

  it("gives a guest the marketing shell and its sign-up path", () => {
    useAuthMock.mockReturnValue({ status: "unauthenticated", user: null });

    render(<ExploreJobsShell />);

    expect(screen.getByTestId("public-shell")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-shell")).not.toBeInTheDocument();
  });

  it("renders neither shell while the session is still booting", () => {
    useAuthMock.mockReturnValue({ status: "booting", user: null });

    render(<ExploreJobsShell />);

    // The regression this guards: a reload painted the marketing hero, then
    // swapped it for the dashboard once the silent refresh landed.
    expect(screen.queryByTestId("public-shell")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-shell")).not.toBeInTheDocument();
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });
});

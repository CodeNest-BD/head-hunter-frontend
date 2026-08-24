import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useAuthMock = vi.fn();
vi.mock("@/features/auth", () => ({
  useAuth: () => useAuthMock(),
}));

// The shell stands in for itself: this file is about whether the public shell
// wraps the page, not what it renders.
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
  it("wraps a signed-in user in the public shell — explore is a public route, no sidebar", () => {
    useAuthMock.mockReturnValue({
      status: "authenticated",
      user: { role: "recruiter" },
    });

    render(<ExploreJobsShell />);

    expect(screen.getByTestId("public-shell")).toBeInTheDocument();
    expect(screen.getByTestId("explore-view")).toBeInTheDocument();
  });

  it("wraps a guest in the same public shell", () => {
    useAuthMock.mockReturnValue({ status: "unauthenticated", user: null });

    render(<ExploreJobsShell />);

    expect(screen.getByTestId("public-shell")).toBeInTheDocument();
    expect(screen.getByTestId("explore-view")).toBeInTheDocument();
  });

  it("renders no shell while the session is still booting", () => {
    useAuthMock.mockReturnValue({ status: "booting", user: null });

    render(<ExploreJobsShell />);

    // Holding until the session settles avoids flashing the guest CTAs before
    // swapping to the account menu.
    expect(screen.queryByTestId("public-shell")).not.toBeInTheDocument();
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });
});

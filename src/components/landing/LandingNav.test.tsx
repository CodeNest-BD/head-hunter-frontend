import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import { LandingNav } from "./LandingNav";

// Control the auth lifecycle state directly; UserMenu (and, via
// useVerificationGate, the recruiters feature's session read) also resolve
// to this same mock, so the authenticated case renders without a store.
// Mocked at both specifiers since useIsVerifiedRecruiter imports the concrete
// hook module directly rather than the barrel.
const useAuthMock = vi.fn();
vi.mock("@/features/auth", () => ({
  useAuth: () => useAuthMock(),
}));
vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

const authedUser = {
  id: "u1",
  email: "amy@example.com",
  username: "amy",
  firstName: "Amy",
  lastName: "Lee",
  phone: null,
  role: "recruiter" as const,
  emailVerified: true,
};

const guestCtas = () =>
  screen.queryAllByRole("link", { name: /^(Log In|Sign Up)$/ });

describe("LandingNav auth CTAs", () => {
  beforeEach(() => {
    useAuthMock.mockReset();
  });

  it("shows Log In / Sign Up when the session is known to be signed out", () => {
    useAuthMock.mockReturnValue({
      status: "unauthenticated",
      user: null,
      logout: vi.fn(),
    });
    renderWithProviders(<LandingNav />);
    expect(guestCtas().length).toBeGreaterThan(0);
  });

  it("does NOT show guest CTAs while the session is still booting", () => {
    // The bug: a signed-in visitor briefly saw Log In / Sign Up during the
    // silent boot refresh because booting was treated as signed-out.
    useAuthMock.mockReturnValue({
      status: "booting",
      user: null,
      logout: vi.fn(),
    });
    renderWithProviders(<LandingNav />);
    expect(guestCtas()).toHaveLength(0);
  });

  it("shows the user menu and no guest CTAs when authenticated", () => {
    useAuthMock.mockReturnValue({
      status: "authenticated",
      user: authedUser,
      logout: vi.fn(),
    });
    renderWithProviders(<LandingNav />);
    expect(guestCtas()).toHaveLength(0);
    expect(screen.getAllByText("Amy Lee").length).toBeGreaterThan(0);
  });
});

import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils";
import { RequireRole } from "./RequireRole";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const useAuthMock = vi.fn();
vi.mock("../hooks/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

const signedInAs = (role: "company" | "recruiter") => ({
  status: "authenticated" as const,
  user: { id: "u1", email: "a@b.c", role, emailVerified: true, profile: null },
});

describe("RequireRole", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it("renders the page for a matching role", () => {
    useAuthMock.mockReturnValue(signedInAs("company"));
    renderWithProviders(
      <RequireRole role="company">
        <p>Company only</p>
      </RequireRole>,
    );
    expect(screen.getByText("Company only")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("hides the page and redirects a mismatched role", () => {
    useAuthMock.mockReturnValue(signedInAs("recruiter"));
    renderWithProviders(
      <RequireRole role="company">
        <p>Company only</p>
      </RequireRole>,
    );
    expect(screen.queryByText("Company only")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });

  it("renders nothing while the session is still booting", () => {
    useAuthMock.mockReturnValue({ status: "booting", user: null });
    renderWithProviders(
      <RequireRole role="company">
        <p>Company only</p>
      </RequireRole>,
    );
    expect(screen.queryByText("Company only")).not.toBeInTheDocument();
    // Booting is not a mismatch — redirecting here would bounce a valid user.
    expect(replace).not.toHaveBeenCalled();
  });
});

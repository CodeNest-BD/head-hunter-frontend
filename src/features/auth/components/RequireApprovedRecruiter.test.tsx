import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import { RequireApprovedRecruiter } from "./RequireApprovedRecruiter";

const useVerificationGateMock = vi.fn();
vi.mock("@/features/recruiters/hooks/useVerificationGate", () => ({
  useVerificationGate: () => useVerificationGateMock(),
}));

vi.mock("@/features/recruiters/components/VerificationBanner", () => ({
  VerificationBanner: () => <p>Verification banner</p>,
}));

describe("RequireApprovedRecruiter", () => {
  it("renders the page once approved", () => {
    useVerificationGateMock.mockReturnValue({
      isApproved: true,
      isLoading: false,
      isError: false,
      retry: vi.fn(),
    });

    renderWithProviders(
      <RequireApprovedRecruiter>
        <p>Gated content</p>
      </RequireApprovedRecruiter>,
    );

    expect(screen.getByText("Gated content")).toBeInTheDocument();
  });

  it("shows the verification banner instead of the page while unapproved", () => {
    useVerificationGateMock.mockReturnValue({
      isApproved: false,
      isLoading: false,
      isError: false,
      retry: vi.fn(),
    });

    renderWithProviders(
      <RequireApprovedRecruiter>
        <p>Gated content</p>
      </RequireApprovedRecruiter>,
    );

    expect(screen.queryByText("Gated content")).not.toBeInTheDocument();
    expect(screen.getByText("Verification banner")).toBeInTheDocument();
  });

  // Regression: a failed profile fetch also reports `isApproved: false` (via
  // a null status), but previously fell through to `VerificationBanner`,
  // which renders nothing for a null status — a blank page on every
  // transient failure instead of a retry.
  it("shows a retry callout, not a blank page, when the profile fetch fails", () => {
    const retry = vi.fn();
    useVerificationGateMock.mockReturnValue({
      isApproved: false,
      isLoading: false,
      isError: true,
      retry,
    });

    renderWithProviders(
      <RequireApprovedRecruiter>
        <p>Gated content</p>
      </RequireApprovedRecruiter>,
    );

    expect(screen.queryByText("Gated content")).not.toBeInTheDocument();
    expect(screen.queryByText("Verification banner")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("renders the loading skeleton while the status is unresolved", () => {
    useVerificationGateMock.mockReturnValue({
      isApproved: false,
      isLoading: true,
      isError: false,
      retry: vi.fn(),
    });

    renderWithProviders(
      <RequireApprovedRecruiter>
        <p>Gated content</p>
      </RequireApprovedRecruiter>,
    );

    expect(screen.queryByText("Gated content")).not.toBeInTheDocument();
    expect(screen.queryByText("Verification banner")).not.toBeInTheDocument();
  });
});

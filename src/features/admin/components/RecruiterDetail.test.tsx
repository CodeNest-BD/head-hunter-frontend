import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/utils";
import { RecruiterDetail } from "./RecruiterDetail";

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock("@/shared/hooks/useCanonicalPath", () => ({
  useCanonicalPath: () => {},
}));

const RECRUITER = {
  userId: "u-1",
  recruiterProfileId: "rp-1",
  recruiterSerialNumber: 248,
  firstName: "Dana",
  lastName: "Whitfield",
  email: "dana@example.test",
  status: "active",
  subscriptionStatus: "none",
  verificationStatus: "verified",
  ratingAvg: null,
  ratingCount: 0,
  city: null,
  state: null,
  joinedAt: "2026-09-24T11:53:00.000Z",
  placementCount: 1,
  commissionMinor: 1000000,
  emailVerified: true,
  experiences: [
    { id: "e1", firmName: "Northstar Talent", years: 4, specializations: [] },
  ],
  verifiedAt: "2026-09-24T11:53:00.000Z",
  verificationNote: null,
  phone: "+1 614 555 0177",
  addressLine: null,
  zip: null,
  linkedinUrl: null,
  yearsExperience: null,
  specializations: null,
  lastLoginAt: "2026-09-24T11:53:00.000Z",
  currentPeriodEnd: null,
  candidateCount: 1,
  releasedEarningsMinor: 1000000,
  phoneVerified: false,
  references: [
    { id: "r1", name: "Priya Raman", company: null, verified: true },
  ],
};

const idle = { mutate: vi.fn(), isPending: false };

vi.mock("../hooks/useAdmin", () => ({
  useAdminRecruiter: () => ({
    data: RECRUITER,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useAdminConversations: () => ({
    data: {
      data: [
        {
          candidateId: "c1",
          jobTitle: "Senior Controller",
          companyName: "Northstar Talent",
          messageCount: 0,
          lastActivityAt: "2026-09-24T11:53:00.000Z",
          status: "submitted",
        },
      ],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useDecideRecruiterVerification: () => idle,
  useDeleteRecruiter: () => idle,
  useSuspendAccount: () => idle,
  useReinstateAccount: () => idle,
}));

describe("RecruiterDetail tabs", () => {
  it("opens on Overview, with the rail beside it", () => {
    renderWithProviders(<RecruiterDetail recruiterRef="248" />);

    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Verification")).toBeInTheDocument();
    expect(screen.getByText("Recent Submissions")).toBeInTheDocument();
    // The rail belongs to the record, not to a tab, so it is always present.
    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText("Marketplace")).toBeInTheDocument();
  });

  it("shows each tab's own panel and hides the others", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RecruiterDetail recruiterRef="248" />);

    await user.click(screen.getByRole("tab", { name: "Recruiting History" }));
    expect(screen.getByText("Northstar Talent")).toBeInTheDocument();
    expect(screen.queryByText("Verification")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "References" }));
    expect(screen.getByText(/Priya Raman/)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Submissions" }));
    expect(screen.getByText("Submissions", { selector: "div" })).toBeVisible();
    // The Overview preview's title is gone once the full list is shown.
    expect(screen.queryByText("Recent Submissions")).not.toBeInTheDocument();
  });

  it("moves to the Submissions tab from the Overview preview's link", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RecruiterDetail recruiterRef="248" />);

    await user.click(
      screen.getByRole("button", { name: /View all submissions/ }),
    );

    expect(screen.getByRole("tab", { name: "Submissions" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.queryByText("Recent Submissions")).not.toBeInTheDocument();
  });
});

import { describe, expect, it } from "vitest";

import { navForRole } from "./dashboardNav";

describe("recruiter navigation", () => {
  it("shows an approved recruiter their full workspace", () => {
    const labels = navForRole("recruiter", true).map((item) => item.label);

    expect(labels).toEqual(
      expect.arrayContaining([
        "Dashboard",
        "Companies",
        "Submissions",
        "Wallet",
      ]),
    );
  });

  it("reduces an unapproved recruiter to the dashboard", () => {
    const labels = navForRole("recruiter", false).map((item) => item.label);

    expect(labels).toEqual(["Dashboard"]);
  });

  it("keeps top-bar destinations (job map, notifications, profile) out of the sidebar", () => {
    const labels = navForRole("recruiter", true).map((item) => item.label);

    expect(labels).not.toContain("Job map");
    expect(labels).not.toContain("Notifications");
    expect(labels).not.toContain("My profile");
  });

  it("never reduces a company's navigation", () => {
    expect(navForRole("company", false)).toEqual(navForRole("company", true));
  });

  it("never reduces an admin's navigation", () => {
    expect(navForRole("admin", false)).toEqual(navForRole("admin", true));
  });
});

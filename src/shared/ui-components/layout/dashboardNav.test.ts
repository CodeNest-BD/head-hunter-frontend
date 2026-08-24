import { describe, expect, it } from "vitest";

import { navForRole } from "./dashboardNav";

describe("recruiter navigation", () => {
  it("shows an approved recruiter their full workspace", () => {
    const labels = navForRole("recruiter", true).map((item) => item.label);

    expect(labels).toEqual(
      expect.arrayContaining([
        "Dashboard",
        "Companies",
        "Inbox",
        "Wallet",
        "Profile",
      ]),
    );
  });

  it("reduces an unapproved recruiter to the dashboard and their profile", () => {
    const labels = navForRole("recruiter", false).map((item) => item.label);

    expect(labels).toEqual(["Dashboard", "Profile"]);
  });

  it("keeps the top-bar-only destinations (job map, notifications) out of the sidebar", () => {
    const labels = navForRole("recruiter", true).map((item) => item.label);

    expect(labels).not.toContain("Job map");
    expect(labels).not.toContain("Notifications");
  });

  it("never reduces a company's navigation", () => {
    expect(navForRole("company", false)).toEqual(navForRole("company", true));
  });

  it("never reduces an admin's navigation", () => {
    expect(navForRole("admin", false)).toEqual(navForRole("admin", true));
  });
});

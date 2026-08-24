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

  it("reduces an unapproved company to its profile alone", () => {
    // Narrower than the recruiter's reduction on purpose: a pending company
    // has no dashboard worth showing (every tile on it 403s), and the profile
    // is the page it completes to get approved. Notifications stay reachable
    // from the top-bar bell rather than the sidebar.
    const labels = navForRole("company", false).map((item) => item.label);

    expect(labels).toEqual(["Profile"]);
  });

  it("gives an approved company its full navigation", () => {
    const labels = navForRole("company", true).map((item) => item.label);

    expect(labels).toEqual(
      expect.arrayContaining([
        "Dashboard",
        "Jobs",
        "Inbox",
        "Wallet",
        "Profile",
      ]),
    );
  });

  it("never reduces an admin's navigation", () => {
    expect(navForRole("admin", false)).toEqual(navForRole("admin", true));
  });
});

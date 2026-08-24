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

  it("reduces an unapproved recruiter to their profile alone", () => {
    // The dashboard goes with the rest: every tile on it reads an endpoint the
    // approval gate refuses, so it could only ever render the pending banner.
    const labels = navForRole("recruiter", false).map((item) => item.label);

    expect(labels).toEqual(["Profile"]);
  });

  it("keeps the top-bar-only destinations (job map, notifications) out of the sidebar", () => {
    const labels = navForRole("recruiter", true).map((item) => item.label);

    expect(labels).not.toContain("Job map");
    expect(labels).not.toContain("Notifications");
  });

  it("reduces an unapproved company to its profile alone", () => {
    // Same rule as the recruiter above: the profile is the page it completes
    // to get approved, and notifications stay reachable from the top-bar bell
    // rather than the sidebar.
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

import { describe, expect, it } from "vitest";

import { navForRole, navGroupsForRole } from "./dashboardNav";

describe("recruiter navigation", () => {
  it("shows an approved recruiter their full workspace", () => {
    const labels = navForRole("recruiter", true).map((item) => item.label);

    // Grouped order: Overview, Marketplace, Operations, Finance, Account —
    // the redesign's own headings, so Disputes now precedes Wallet.
    expect(labels).toEqual([
      "Dashboard",
      "Live Map",
      "Inbox",
      "Submissions",
      "Disputes",
      "Wallet",
      "My Profile",
    ]);
  });

  it("keeps an unapproved recruiter's map (locked teaser) and profile", () => {
    // The dashboard goes: every tile on it reads an endpoint the approval gate
    // refuses, so it could only ever render the pending banner. The map stays —
    // it renders its own locked teaser nudging the recruiter to verify.
    const labels = navForRole("recruiter", false).map((item) => item.label);

    expect(labels).toEqual(["Live Map", "My Profile"]);
  });

  it("keeps notifications out of the sidebar (bell dropdown only)", () => {
    const labels = navForRole("recruiter", true).map((item) => item.label);

    expect(labels).toContain("Live Map");
    expect(labels).not.toContain("Notifications");
  });

  it("reduces an unapproved company to its profile alone", () => {
    // Same rule as the recruiter above: the profile is the page it completes
    // to get approved, and notifications stay reachable from the top-bar bell
    // rather than the sidebar.
    const labels = navForRole("company", false).map((item) => item.label);

    expect(labels).toEqual(["My Profile"]);
  });

  it("gives an approved company its full navigation", () => {
    const labels = navForRole("company", true).map((item) => item.label);

    expect(labels).toEqual(
      expect.arrayContaining([
        "Dashboard",
        "Jobs",
        "Inbox",
        "Wallet",
        "My Profile",
      ]),
    );
  });

  it("never reduces an admin's navigation", () => {
    expect(navForRole("admin", false)).toEqual(navForRole("admin", true));
  });
});

describe("navigation groups", () => {
  it("drops a heading whose items were all filtered away", () => {
    // An unapproved company keeps only its profile, so Overview, Marketplace,
    // Operations and Finance have nothing left — a heading over an empty run
    // reads as a section that failed to load.
    const groups = navGroupsForRole("company", false);

    expect(groups.map((g) => g.label)).toEqual(["Account"]);
    expect(groups[0].items.map((i) => i.label)).toEqual(["My Profile"]);
  });

  it("gives the admin the design's five headings", () => {
    expect(navGroupsForRole("admin", true).map((g) => g.label)).toEqual([
      "Overview",
      "Marketplace",
      "Operations",
      "System",
    ]);
  });

  it("flattens to exactly what the groups hold", () => {
    const groups = navGroupsForRole("recruiter", true);

    expect(navForRole("recruiter", true)).toEqual(
      groups.flatMap((g) => g.items),
    );
  });
});

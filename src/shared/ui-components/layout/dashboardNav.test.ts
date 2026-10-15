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
      "Settings",
    ]);
  });

  it("keeps an unapproved recruiter's dashboard, map (locked teaser) and profile", () => {
    const labels = navForRole("recruiter", false).map((item) => item.label);

    expect(labels).toEqual(["Dashboard", "Live Map", "Settings"]);
  });

  it("keeps notifications out of the sidebar (bell dropdown only)", () => {
    const labels = navForRole("recruiter", true).map((item) => item.label);

    expect(labels).toContain("Live Map");
    expect(labels).not.toContain("Notifications");
  });

  it("reduces an unapproved company to its dashboard and profile", () => {
    const labels = navForRole("company", false).map((item) => item.label);

    expect(labels).toEqual(["Dashboard", "Settings"]);
  });

  it("gives an approved company its full navigation", () => {
    const labels = navForRole("company", true).map((item) => item.label);

    expect(labels).toEqual(
      expect.arrayContaining([
        "Dashboard",
        "Jobs",
        "Inbox",
        "Wallet",
        "Settings",
      ]),
    );
  });

  it("never reduces an admin's navigation", () => {
    expect(navForRole("admin", false)).toEqual(navForRole("admin", true));
  });
});

describe("navigation groups", () => {
  it("drops a heading whose items were all filtered away", () => {
    // An unapproved company keeps only its dashboard and profile, so
    // Marketplace, Operations and Finance have nothing left — a heading over
    // an empty run reads as a section that failed to load.
    const groups = navGroupsForRole("company", false);

    expect(groups.map((g) => g.label)).toEqual(["Overview", "Account"]);
  });

  it("gives the admin the design's headings, Finance among them", () => {
    expect(navGroupsForRole("admin", true).map((g) => g.label)).toEqual([
      "Overview",
      "Marketplace",
      "Operations",
      "Finance",
      "System",
    ]);
  });

  it("puts both finance boards under one heading", () => {
    const finance = navGroupsForRole("admin", true).find(
      (group) => group.label === "Finance",
    );
    expect(finance?.items.map((item) => item.href)).toEqual([
      "/admin/payments",
      "/admin/payouts",
    ]);
  });

  it("flattens to exactly what the groups hold", () => {
    const groups = navGroupsForRole("recruiter", true);

    expect(navForRole("recruiter", true)).toEqual(
      groups.flatMap((g) => g.items),
    );
  });
});

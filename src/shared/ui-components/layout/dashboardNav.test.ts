import { describe, expect, it } from "vitest";

import { navForRole, navGroupsForRole } from "./dashboardNav";

describe("recruiter navigation", () => {
  it("shows an approved recruiter their full workspace", () => {
    const labels = navForRole("recruiter", true).map((item) => item.label);

    // Live Map leads as its own untitled run, then the headed groups:
    // Overview, Marketplace, Operations, Finance, Account — the redesign's
    // own headings, so Disputes still precedes Wallet.
    expect(labels).toEqual([
      "Live Map",
      "Dashboard",
      "Inbox",
      "Submissions",
      "Disputes",
      "Wallet",
      "Settings",
    ]);
  });

  it("leads the recruiter's rail with the live map, above every heading", () => {
    const groups = navGroupsForRole("recruiter", true);

    expect(groups[0].label).toBeUndefined();
    expect(groups[0].items.map((item) => item.label)).toEqual(["Live Map"]);
    expect(groups[1].label).toBe("Overview");
  });

  it("keeps an unapproved recruiter's dashboard, map (locked teaser) and profile", () => {
    const labels = navForRole("recruiter", false).map((item) => item.label);

    expect(labels).toEqual(["Live Map", "Dashboard", "Settings"]);
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

  it("drops the featured run too when its one item is filtered away", () => {
    // Nothing filters Live Map away today, but the flatMap must not leave a
    // ruled-off empty block behind if that ever changes.
    const groups = navGroupsForRole("company", true);

    expect(groups.every((group) => group.items.length > 0)).toBe(true);
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

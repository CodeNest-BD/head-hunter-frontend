import { describe, expect, it } from "vitest";

import { navForRole } from "./dashboardNav";

describe("recruiter navigation", () => {
  it("shows an approved recruiter their full workspace", () => {
    const labels = navForRole("recruiter", true).map((item) => item.label);

    expect(labels).toEqual([
      "Dashboard",
      "Live Map",
      "Inbox",
      "Submissions",
      "Wallet",
      "Disputes",
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

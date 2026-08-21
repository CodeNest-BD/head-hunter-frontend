import { describe, expect, it } from "vitest";

import { navForRole } from "./dashboardNav";

describe("recruiter navigation", () => {
  it("shows an approved recruiter their full workspace", () => {
    const labels = navForRole("recruiter", true).map((item) => item.label);

    expect(labels).toEqual(
      expect.arrayContaining([
        "Dashboard",
        "Companies",
        "Notifications",
        "Submissions",
        "Wallet",
        "My profile",
      ]),
    );
  });

  it("reduces an unapproved recruiter to notifications and their profile", () => {
    const labels = navForRole("recruiter", false).map((item) => item.label);

    expect(labels).toEqual(["Notifications", "My profile"]);
  });

  it("never reduces a company's navigation", () => {
    expect(navForRole("company", false)).toEqual(navForRole("company", true));
  });

  it("never reduces an admin's navigation", () => {
    expect(navForRole("admin", false)).toEqual(navForRole("admin", true));
  });
});

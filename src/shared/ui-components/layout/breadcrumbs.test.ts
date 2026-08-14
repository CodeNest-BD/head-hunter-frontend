import { describe, expect, it } from "vitest";

import { deriveBreadcrumbs } from "./breadcrumbs";

describe("deriveBreadcrumbs", () => {
  it("returns a single Dashboard crumb on the dashboard", () => {
    expect(deriveBreadcrumbs("/dashboard")).toEqual([{ label: "Dashboard" }]);
  });

  it("roots every other page at a linked Dashboard", () => {
    expect(deriveBreadcrumbs("/companies")).toEqual([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Companies", href: undefined },
    ]);
  });

  it("links intermediate crumbs only when they map to a real page", () => {
    const crumbs = deriveBreadcrumbs("/company/jobs/new");
    expect(crumbs).toEqual([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Company", href: undefined },
      { label: "Jobs", href: "/company/jobs" },
      { label: "New", href: undefined },
    ]);
  });

  it("labels an id segment as Details rather than showing the raw id", () => {
    const crumbs = deriveBreadcrumbs(
      "/recruiter/submissions/3f1c2b90-1a2b-4c3d-8e9f-000000000000",
    );
    expect(crumbs.at(-1)).toEqual({ label: "Details", href: undefined });
    expect(crumbs).toContainEqual({
      label: "Submissions",
      href: "/recruiter/submissions",
    });
  });

  it("title-cases unknown slugs", () => {
    expect(deriveBreadcrumbs("/some-new-area")).toEqual([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Some New Area", href: undefined },
    ]);
  });
});

import { describe, expect, it } from "vitest";

import { jobIdFromSlug, jobPath } from "./jobPath";

const ID = "fb409dfe-a1dc-4dc8-854b-fe48695c1a9e";

describe("jobPath", () => {
  it("prefixes the id with a slug of the title", () => {
    expect(
      jobPath({ id: ID, title: "Senior Software Engineer (Remote)" }),
    ).toBe(`/jobs/senior-software-engineer-remote-${ID}`);
  });

  it("strips accents and falls back to the bare id when nothing is left", () => {
    expect(jobPath({ id: ID, title: "Café Manager" })).toBe(
      `/jobs/cafe-manager-${ID}`,
    );
    expect(jobPath({ id: ID, title: "!!!" })).toBe(`/jobs/${ID}`);
  });

  it("round-trips through jobIdFromSlug, and accepts an old bare-uuid link", () => {
    const segment = jobPath({ id: ID, title: "C++ Developer" }).slice(
      "/jobs/".length,
    );
    expect(jobIdFromSlug(segment)).toBe(ID);
    expect(jobIdFromSlug(ID)).toBe(ID);
  });
});

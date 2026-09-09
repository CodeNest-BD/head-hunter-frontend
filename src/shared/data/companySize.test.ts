import { describe, expect, it } from "vitest";

import { COMPANY_SIZE_OPTIONS, companySizeOptions } from "./companySize";

describe("companySizeOptions", () => {
  it("offers the canonical buckets for an empty or on-list value", () => {
    expect(companySizeOptions("")).toEqual(COMPANY_SIZE_OPTIONS);
    expect(companySizeOptions("51-200")).toEqual(COMPANY_SIZE_OPTIONS);
  });

  it("keeps a stored bucket that is not on the list selectable", () => {
    expect(companySizeOptions("31-50")).toEqual([
      "31-50",
      ...COMPANY_SIZE_OPTIONS,
    ]);
  });

  it("offers a pending value alongside the current one, without repeats", () => {
    // The picker must already hold the option when a prefill writes it, so the
    // incoming value is passed in too — and both may be the same bucket.
    expect(companySizeOptions("", "31-50")).toEqual([
      "31-50",
      ...COMPANY_SIZE_OPTIONS,
    ]);
    expect(companySizeOptions("31-50", "31-50")).toEqual([
      "31-50",
      ...COMPANY_SIZE_OPTIONS,
    ]);
  });
});

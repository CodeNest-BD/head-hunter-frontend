import { describe, expect, it } from "vitest";
import {
  COMPANY_SETTABLE_STATUSES,
  SETTABLE_SUBMISSION_STATUSES,
  SUBMISSION_STATUSES,
  SUBMISSION_STATUS_FILTER_OPTIONS,
  SUBMISSION_STATUS_LABELS,
  isCompanySettableStatus,
} from "./schemas";

describe("submission statuses", () => {
  it("labels every status, so no stored row renders a blank badge", () => {
    for (const status of SUBMISSION_STATUSES) {
      expect(SUBMISSION_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it("offers every status as a filter, so no stored row is unfindable", () => {
    expect(SUBMISSION_STATUS_FILTER_OPTIONS.map(({ value }) => value)).toEqual([
      ...SUBMISSION_STATUSES,
    ]);
  });

  it("treats only the statuses the platform reacts to as settable", () => {
    expect([...SETTABLE_SUBMISSION_STATUSES]).toEqual([
      "submitted",
      "rejected",
      "withdrawn",
    ]);
  });

  it("keeps withdrawing out of the company's hands", () => {
    expect([...COMPANY_SETTABLE_STATUSES]).not.toContain("withdrawn");
    expect(isCompanySettableStatus("withdrawn")).toBe(false);
  });

  it("does not treat a status that gates nothing as company-settable", () => {
    expect(isCompanySettableStatus("under_review")).toBe(false);
    expect(isCompanySettableStatus("advanced")).toBe(false);
    expect(isCompanySettableStatus("rejected")).toBe(true);
  });
});

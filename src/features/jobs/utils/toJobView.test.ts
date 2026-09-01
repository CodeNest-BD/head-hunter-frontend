import { describe, expect, it } from "vitest";

import type { JobFormValues } from "../schemas";
import { intakeToFormValues } from "./jobIntake";
import { formValuesToJobView } from "./toJobView";

const base: JobFormValues = {
  title: "Senior Backend Engineer",
  description: "<p>Build the marketplace.</p>",
  roleCategory: "engineering",
  employmentType: "full_time",
  locationState: "CA",
  locationCity: "San Jose",
  isRemote: false,
  salaryMin: "120000",
  salaryMax: "160000",
  salaryRatePeriod: "per_year",
  recruiterFee: "10000",
  companyName: "Northwind Robotics",
  // The intake half of the form, unanswered.
  ...intakeToFormValues(null),
};

describe("formValuesToJobView", () => {
  it("converts a fully-filled form to minor-unit money and passes fields through", () => {
    const view = formValuesToJobView(base);

    expect(view).toMatchObject({
      title: "Senior Backend Engineer",
      roleCategory: "engineering",
      employmentType: "full_time",
      locationCity: "San Jose",
      locationState: "CA",
      isRemote: false,
      salaryMinMinor: 12_000_000,
      salaryMaxMinor: 16_000_000,
      recruiterFeeMinor: 1_000_000,
      description: "<p>Build the marketplace.</p>",
    });
    // A draft has never been published — no "posted N ago" in the preview.
    expect(view.publishedAt).toBeNull();
  });

  it("maps blank optional fields to null rather than empty strings or zero", () => {
    const view = formValuesToJobView({
      ...base,
      employmentType: "",
      locationCity: "   ",
      salaryMin: "",
      salaryMax: "",
      description: "   ",
    });

    expect(view.employmentType).toBeNull();
    expect(view.locationCity).toBeNull();
    expect(view.salaryMinMinor).toBeNull();
    expect(view.salaryMaxMinor).toBeNull();
    expect(view.description).toBeNull();
  });

  it("previews a not-yet-entered fee as zero, since the view's fee is required", () => {
    const view = formValuesToJobView({ ...base, recruiterFee: "" });

    expect(view.recruiterFeeMinor).toBe(0);
  });

  it("keeps a remote role's location fields as entered but null when blank", () => {
    const view = formValuesToJobView({
      ...base,
      isRemote: true,
      locationState: "",
      locationCity: "",
    });

    expect(view.isRemote).toBe(true);
    expect(view.locationState).toBeNull();
    expect(view.locationCity).toBeNull();
  });
});

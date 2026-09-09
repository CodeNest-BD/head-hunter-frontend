import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { JobForm } from "./JobForm";

vi.mock("@/features/billing", () => ({
  useMinRecruiterFee: () => ({ data: { amountMinor: 50000 } }),
}));

const employeeSize = vi.hoisted(() => ({ current: "51-200" }));

vi.mock("@/features/companies", () => ({
  useMyCompanyProfile: () => ({
    data: {
      companyName: "MyNewCompany Ltd.",
      addressLine: "1 Main St",
      zip: "94103",
      industry: "SaaS",
      employeeSize: employeeSize.current,
      revenue: "50M",
      yearFounded: 2016,
      description: "We are king company",
      state: "CA",
      city: "San Francisco",
    },
  }),
}));

async function renderNewJob() {
  render(
    <JobForm
      onSubmit={() => {}}
      isSubmitting={false}
      submitLabel="Save as draft"
    />,
  );
  // The whole Company Info block prefills together, so waiting on the industry
  // input is waiting for the profile to have landed.
  await screen.findByDisplayValue("SaaS");
  return screen.getByRole("combobox", { name: /employee size/i });
}

describe("JobForm company info prefill", () => {
  it("fills Employee Size from the company profile", async () => {
    employeeSize.current = "51-200";

    expect(await renderNewJob()).toHaveTextContent("51-200");
  });

  it("keeps a profile bucket that predates the fixed list", async () => {
    // The column is free text, so profiles hold buckets like this one. Radix
    // clears a value whose option is missing, which read as "the profile did
    // not prefill" — the option has to be there when the value arrives.
    employeeSize.current = "31-50";

    expect(await renderNewJob()).toHaveTextContent("31-50");
  });
});

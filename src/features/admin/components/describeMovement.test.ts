import { describe, expect, it } from "vitest";

import { describeMovement } from "./financeFacts";

const UUID = "89b6e914-f474-488a-9e63-08eadd52d68a";

describe("describeMovement", () => {
  it("reduces a legacy sentence to the cause after the dash", () => {
    expect(
      describeMovement(
        `Recruiter fee released to recruiter — placement ${UUID} guarantee passed`,
      ),
    ).toBe("Guarantee passed");
  });

  it("keeps a legacy dispute outcome, which the row says nowhere else", () => {
    expect(
      describeMovement(
        `Recruiter fee released — dispute on placement ${UUID} resolved for the recruiter`,
      ),
    ).toBe("Dispute resolved for the recruiter");
    expect(
      describeMovement(
        `Recruiter fee refunded — dispute on placement ${UUID} resolved for the company`,
      ),
    ).toBe("Dispute resolved for the company");
  });

  it("handles a legacy sentence that never reached a dash", () => {
    expect(
      describeMovement(`Recruiter fee held in escrow — placement ${UUID}`),
    ).toBe("Held in escrow");
  });

  it("leaves a description written as a bare cause alone", () => {
    for (const cause of [
      "Guarantee passed with no hold",
      "Offer accepted",
      "Hire rejected before the release date",
      "Dispute resolved in the recruiter’s favour",
      "Wallet top-up via Stripe Checkout",
    ]) {
      expect(describeMovement(cause)).toBe(cause);
    }
  });

  it("does not truncate a non-legacy reason that contains a dash", () => {
    expect(describeMovement("Adjustment — duplicate reservation")).toBe(
      "Adjustment — duplicate reservation",
    );
  });

  it("reports nothing when only duplication was left", () => {
    expect(describeMovement(`placement ${UUID}`)).toBeNull();
    expect(describeMovement("")).toBeNull();
    expect(describeMovement(null)).toBeNull();
  });
});

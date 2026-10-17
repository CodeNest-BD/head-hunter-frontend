import { describe, expect, it } from "vitest";
import { describeMovement } from "@/features/admin/components/financeFacts";

describe("describeMovement", () => {
  const UUID = "89b6e914-f474-488a-9e63-08eadd52d68a";

  it("drops the placement UUID the row already shows as PLC-…", () => {
    expect(
      describeMovement(
        `Recruiter fee released to recruiter — placement ${UUID} guarantee passed`,
      ),
    ).toBe("Recruiter fee released to recruiter — guarantee passed");
  });

  it("keeps the word dispute when only the placement id goes", () => {
    expect(
      describeMovement(
        `Recruiter fee released — dispute on placement ${UUID} resolved for the recruiter`,
      ),
    ).toBe("Recruiter fee released — dispute resolved for the recruiter");
  });

  it("trims a dash left dangling by the removed id", () => {
    expect(
      describeMovement(`Recruiter fee held in escrow — placement ${UUID}`),
    ).toBe("Recruiter fee held in escrow");
  });

  it("leaves the new descriptions untouched", () => {
    expect(
      describeMovement(
        "Released to the recruiter — the guarantee passed with no hold",
      ),
    ).toBe("Released to the recruiter — the guarantee passed with no hold");
  });

  it("reports nothing when only duplication was left", () => {
    expect(describeMovement(`placement ${UUID}`)).toBeNull();
    expect(describeMovement(null)).toBeNull();
  });
});

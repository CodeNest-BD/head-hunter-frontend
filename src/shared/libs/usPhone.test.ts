import { describe, expect, it } from "vitest";
import { formatUsPhoneDigits, toE164UsPhone, toUsPhoneDigits } from "./usPhone";

describe("toUsPhoneDigits", () => {
  it("keeps digits only, dropping whatever punctuation was typed", () => {
    expect(toUsPhoneDigits("(202) 555-0100")).toBe("2025550100");
    expect(toUsPhoneDigits("202.555.0100")).toBe("2025550100");
  });

  it("drops a pasted country code rather than the national number", () => {
    expect(toUsPhoneDigits("+1 202 555 0100")).toBe("2025550100");
    expect(toUsPhoneDigits("0012025550100")).toBe("2025550100");
  });

  it("never exceeds ten digits", () => {
    expect(toUsPhoneDigits("20255501009999")).toHaveLength(10);
  });
});

describe("formatUsPhoneDigits", () => {
  it("groups as far as the digits go, with no trailing separator", () => {
    expect(formatUsPhoneDigits("")).toBe("");
    expect(formatUsPhoneDigits("202")).toBe("202");
    expect(formatUsPhoneDigits("2025")).toBe("202 5");
    expect(formatUsPhoneDigits("2025550100")).toBe("202 555 0100");
  });
});

describe("toE164UsPhone", () => {
  it("prefixes the fixed US dialing code", () => {
    expect(toE164UsPhone("2025550100")).toBe("+12025550100");
  });
});

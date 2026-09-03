import { describe, expect, it } from "vitest";
import { MAX_MONEY_MAJOR, MAX_MONEY_MAJOR_LABEL } from "@/shared/utils/money";
import {
  companyEmployeeInfoFormSchema,
  companyProfileFormSchema,
} from "./schemas";

const valid = {
  companyName: "Acme Inc.",
  website: "",
  description: "",
  commissionMin: "",
  commissionMax: "",
  addressLine: "123 Market St",
  city: "San Francisco",
  state: "CA",
  zip: "94103",
  industry: "",
  yearFounded: "",
  employeeSize: "",
  revenue: "",
};

const errorPaths = (overrides: Record<string, unknown>): string[] => {
  const result = companyProfileFormSchema.safeParse({ ...valid, ...overrides });
  return result.success ? [] : result.error.issues.map((i) => i.path.join("."));
};

describe("companyProfileFormSchema", () => {
  it("accepts a profile with a name and an address", () => {
    expect(companyProfileFormSchema.safeParse(valid).success).toBe(true);
  });

  // The address is required at sign-up, so the profile screen must not be a
  // way to blank it back out.
  it("refuses to blank the address it was signed up with", () => {
    expect(errorPaths({ addressLine: "  " })).toContain("addressLine");
    expect(errorPaths({ city: "" })).toContain("city");
    expect(errorPaths({ state: "" })).toContain("state");
    expect(errorPaths({ zip: "" })).toContain("zip");
  });

  it("accepts the business details, all optional", () => {
    expect(
      errorPaths({
        industry: "SaaS",
        yearFounded: "2014",
        employeeSize: "51-200",
        revenue: "$50M",
      }),
    ).toEqual([]);
  });

  it("rejects a state that is not a two-letter code", () => {
    expect(errorPaths({ state: "California" })).toContain("state");
  });

  it("rejects a ZIP that is not 5 digits or ZIP+4", () => {
    expect(errorPaths({ zip: "ABCDE" })).toContain("zip");
    expect(errorPaths({ zip: "94103-1234" })).toEqual([]);
  });

  it("rejects a founding year in the future", () => {
    expect(
      errorPaths({ yearFounded: String(new Date().getFullYear() + 1) }),
    ).toContain("yearFounded");
  });

  it("rejects a founding year before 1800", () => {
    expect(errorPaths({ yearFounded: "1799" })).toContain("yearFounded");
  });

  it("rejects a blank company name", () => {
    expect(errorPaths({ companyName: "   " })).toContain("companyName");
  });

  it("accepts an empty website, which means unset", () => {
    expect(errorPaths({ website: "" })).toEqual([]);
  });

  it("rejects a website that is not a URL", () => {
    expect(errorPaths({ website: "acme" })).toContain("website");
  });

  it("rejects a commission maximum below the minimum", () => {
    expect(
      errorPaths({ commissionMin: "20000", commissionMax: "3000" }),
    ).toContain("commissionMax");
  });

  it("accepts a commission range with only one bound set", () => {
    expect(errorPaths({ commissionMin: "3000", commissionMax: "" })).toEqual(
      [],
    );
  });

  it("accepts equal bounds", () => {
    expect(
      errorPaths({ commissionMin: "5000", commissionMax: "5000" }),
    ).toEqual([]);
  });

  it("rejects a commission beyond the platform ceiling, on either end", () => {
    const beyond = String(MAX_MONEY_MAJOR + 1);

    expect(errorPaths({ commissionMin: beyond })).toContain("commissionMin");
    expect(errorPaths({ commissionMax: beyond })).toContain("commissionMax");
  });

  it("rejects a commission that is not a number", () => {
    expect(errorPaths({ commissionMin: "a lot" })).toContain("commissionMin");
  });

  it("says how much is too much in words, not in minor units", () => {
    const result = companyProfileFormSchema.safeParse({
      ...valid,
      commissionMax: String(MAX_MONEY_MAJOR + 1),
    });

    expect(result.success).toBe(false);
    const message = result.success ? "" : result.error.issues[0].message;
    expect(message).toBe(`Commission must be under ${MAX_MONEY_MAJOR_LABEL}`);
  });
});

describe("companyEmployeeInfoFormSchema", () => {
  const employee = {
    firstName: "Jane",
    lastName: "Doe",
    phone: "+12025550100",
  };
  const employeeErrorPaths = (overrides: Record<string, unknown>): string[] => {
    const result = companyEmployeeInfoFormSchema.safeParse({
      ...employee,
      ...overrides,
    });
    return result.success
      ? []
      : result.error.issues.map((i) => i.path.join("."));
  };

  it("accepts a contact with a valid E.164 phone", () => {
    expect(companyEmployeeInfoFormSchema.safeParse(employee).success).toBe(
      true,
    );
  });

  it("requires the contact name, which the account always has", () => {
    expect(employeeErrorPaths({ firstName: "  " })).toContain("firstName");
  });

  it("rejects a contact name with digits in it", () => {
    expect(employeeErrorPaths({ lastName: "Doe2" })).toContain("lastName");
  });

  // The field holds an E.164 number (any country) from the international input.
  it("requires a valid E.164 number, rejecting a bare or cleared one", () => {
    expect(employeeErrorPaths({ phone: "" })).toContain("phone");
    expect(employeeErrorPaths({ phone: "2025550100" })).toContain("phone");
    expect(employeeErrorPaths({ phone: "+1202555010" })).toContain("phone");
  });
});

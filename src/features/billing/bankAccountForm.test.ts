import { describe, expect, it } from "vitest";

import {
  bankFormSchema,
  identityFormSchema,
  isValidAbaRoutingNumber,
  toIdentityPayload,
} from "./bankAccountForm";

describe("isValidAbaRoutingNumber", () => {
  it("accepts real routing numbers", () => {
    expect(isValidAbaRoutingNumber("110000000")).toBe(true); // Stripe test
    expect(isValidAbaRoutingNumber("021000021")).toBe(true); // Chase
    expect(isValidAbaRoutingNumber("026009593")).toBe(true); // BofA
  });

  it("rejects bad checksums, lengths and characters", () => {
    expect(isValidAbaRoutingNumber("110000001")).toBe(false);
    expect(isValidAbaRoutingNumber("12345678")).toBe(false);
    expect(isValidAbaRoutingNumber("1234567890")).toBe(false);
    expect(isValidAbaRoutingNumber("11000000a")).toBe(false);
  });
});

const validIdentity = {
  firstName: "Dana",
  lastName: "Whitfield",
  email: "dana@example.com",
  phone: "+1 (614) 555-0177",
  dobMonth: "1",
  dobDay: "15",
  dobYear: "1990",
  ssnLast4: "0000",
  addressLine1: "12 Main St",
  city: "Columbus",
  state: "OH",
  postalCode: "43004",
  tosAccepted: true,
};

describe("identityFormSchema", () => {
  it("accepts a complete identity", () => {
    expect(identityFormSchema.safeParse(validIdentity).success).toBe(true);
  });

  it("rejects an impossible calendar date", () => {
    const result = identityFormSchema.safeParse({
      ...validIdentity,
      dobMonth: "2",
      dobDay: "30",
    });
    expect(result.success).toBe(false);
  });

  it("rejects under-18 birth dates", () => {
    const result = identityFormSchema.safeParse({
      ...validIdentity,
      dobYear: String(new Date().getUTCFullYear() - 10),
    });
    expect(result.success).toBe(false);
  });

  it("requires accepting the terms", () => {
    const result = identityFormSchema.safeParse({
      ...validIdentity,
      tosAccepted: false,
    });
    expect(result.success).toBe(false);
  });

  it("maps to the API payload with numeric DOB and uppercased state", () => {
    const parsed = identityFormSchema.parse({
      ...validIdentity,
      state: "oh",
    });
    expect(toIdentityPayload(parsed)).toMatchObject({
      dobDay: 15,
      dobMonth: 1,
      dobYear: 1990,
      state: "OH",
      ssnLast4: "0000",
    });
  });
});

describe("bankFormSchema", () => {
  const validBank = {
    accountHolderName: "Dana Whitfield",
    routingNumber: "110000000",
    accountNumber: "000123456789",
    confirmAccountNumber: "000123456789",
  };

  it("accepts a valid bank entry", () => {
    expect(bankFormSchema.safeParse(validBank).success).toBe(true);
  });

  it("rejects a routing number with a bad checksum", () => {
    const result = bankFormSchema.safeParse({
      ...validBank,
      routingNumber: "110000001",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched account numbers", () => {
    const result = bankFormSchema.safeParse({
      ...validBank,
      confirmAccountNumber: "000123456780",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirmAccountNumber"]);
    }
  });
});

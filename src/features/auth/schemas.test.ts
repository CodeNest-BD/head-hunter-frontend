import { describe, expect, it } from "vitest";
import { signUpSchema, toSignUpPayload, type SignUpFormData } from "./schemas";

const validCompany: SignUpFormData = {
  role: "company",
  firstName: "Jane",
  lastName: "Doe",
  username: "jane_doe",
  email: "jane@acme.com",
  password: "S3cureP@ssw0rd",
  phone: "",
  companyName: "Acme Inc.",
  yearsExperience: "",
  specializations: [],
  references: [],
  addressLine: "",
  city: "",
  state: "",
  zip: "",
};

const validRecruiter: SignUpFormData = {
  ...validCompany,
  role: "recruiter",
  companyName: "",
};

const errorPaths = (overrides: Partial<SignUpFormData>): string[] => {
  const result = signUpSchema.safeParse({ ...validCompany, ...overrides });
  return result.success ? [] : result.error.issues.map((i) => i.path.join("."));
};

describe("signUpSchema", () => {
  it("accepts a company sign-up with only the required fields", () => {
    expect(signUpSchema.safeParse(validCompany).success).toBe(true);
  });

  it("accepts a recruiter sign-up with every optional field empty", () => {
    expect(signUpSchema.safeParse(validRecruiter).success).toBe(true);
  });

  it("requires a company name only for the company role", () => {
    expect(errorPaths({ companyName: "  " })).toContain("companyName");
    expect(errorPaths({ role: "recruiter", companyName: "" })).toEqual([]);
  });

  it("rejects a username that is too short or has illegal characters", () => {
    expect(errorPaths({ username: "ab" })).toContain("username");
    expect(errorPaths({ username: "jane doe" })).toContain("username");
    expect(errorPaths({ username: "jane-doe" })).toContain("username");
  });

  it("rejects blank names", () => {
    expect(errorPaths({ firstName: " " })).toContain("firstName");
    expect(errorPaths({ lastName: " " })).toContain("lastName");
  });

  it("accepts an empty state, otherwise requires a two-letter code", () => {
    expect(errorPaths({ state: "" })).toEqual([]);
    expect(errorPaths({ state: "ca" })).toEqual([]);
    expect(errorPaths({ state: "Cal" })).toContain("state");
  });

  it("accepts years of experience between 0 and 80, or empty", () => {
    expect(errorPaths({ role: "recruiter", yearsExperience: "" })).toEqual([]);
    expect(errorPaths({ role: "recruiter", yearsExperience: "5" })).toEqual([]);
    expect(errorPaths({ role: "recruiter", yearsExperience: "81" })).toContain(
      "yearsExperience",
    );
    expect(errorPaths({ role: "recruiter", yearsExperience: "abc" })).toContain(
      "yearsExperience",
    );
  });

  it("allows at most three references, each with a name", () => {
    const reference = { name: "John Smith", company: "", title: "", phone: "" };
    expect(
      errorPaths({
        role: "recruiter",
        references: [reference, reference, reference, reference],
      }),
    ).toContain("references");
    expect(
      errorPaths({
        role: "recruiter",
        references: [{ ...reference, name: "" }],
      }),
    ).toContain("references.0.name");
  });
});

describe("toSignUpPayload", () => {
  it("builds a company payload without recruiter fields", () => {
    const payload = toSignUpPayload(validCompany);
    expect(payload).toEqual({
      role: "company",
      firstName: "Jane",
      lastName: "Doe",
      username: "jane_doe",
      email: "jane@acme.com",
      password: "S3cureP@ssw0rd",
      companyName: "Acme Inc.",
    });
  });

  it("omits empty optional fields and uppercases the state", () => {
    const payload = toSignUpPayload({
      ...validCompany,
      phone: "+1-202-555-0100",
      state: "ca",
      city: "San Francisco",
    });
    expect(payload).toMatchObject({
      phone: "+1-202-555-0100",
      state: "CA",
      city: "San Francisco",
    });
    expect(payload).not.toHaveProperty("addressLine");
    expect(payload).not.toHaveProperty("zip");
  });

  it("converts recruiter experience to a number and keeps chosen specializations", () => {
    const payload = toSignUpPayload({
      ...validRecruiter,
      yearsExperience: "5",
      specializations: ["technology", "finance"],
    });
    expect(payload).toMatchObject({
      role: "recruiter",
      yearsExperience: 5,
      specializations: ["technology", "finance"],
    });
  });

  it("omits recruiter optionals that were left empty", () => {
    const payload = toSignUpPayload(validRecruiter);
    expect(payload).not.toHaveProperty("yearsExperience");
    expect(payload).not.toHaveProperty("specializations");
    expect(payload).not.toHaveProperty("references");
  });

  it("drops empty optional fields inside each reference", () => {
    const payload = toSignUpPayload({
      ...validRecruiter,
      references: [
        { name: "John Smith", company: "Globex", title: "", phone: "" },
      ],
    });
    expect(payload).toMatchObject({
      references: [{ name: "John Smith", company: "Globex" }],
    });
    if (payload.role === "recruiter") {
      expect(payload.references?.[0]).not.toHaveProperty("title");
      expect(payload.references?.[0]).not.toHaveProperty("phone");
    }
  });
});

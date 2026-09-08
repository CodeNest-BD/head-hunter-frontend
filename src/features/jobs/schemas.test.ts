import { describe, expect, it } from "vitest";
import { formatDaysAndHours, jobFormSchema } from "./schemas";
import { intakeToFormValues } from "./utils/jobIntake";

const valid = {
  title: "Senior Software Engineer",
  description: "<p>We are hiring a senior engineer.</p>",
  roleCategory: "engineering" as const,
  employmentType: "full_time" as const,
  locationState: "CA",
  locationCity: "San Francisco",
  salaryMin: "100000",
  salaryMax: "150000",
  salaryRatePeriod: "per_year" as const,
  recruiterFee: "10000",
  // Mirrored from the company profile, not stored on the job.
  companyName: "Northwind Robotics",
  // The intake half of the form, unanswered apart from the parts that are
  // required outright: the worksite, the schedule and the company details.
  ...intakeToFormValues(null),
  worksiteAddress: "123 Market St",
  worksiteZip: "94103",
  reportsTo: "VP of Engineering",
  daysAndHours: {
    days: ["mon", "tue", "wed", "thu", "fri"] as const,
    startHour: "9",
    endHour: "17",
  },
  companyDetails: {
    industry: "Industrial Robotics",
    employeeSize: "51-200",
    revenue: "50000000",
    yearsInBusiness: "12",
    whatTheyDo: "We build warehouse automation systems.",
  },
};

const errorPaths = (overrides: Record<string, unknown>): string[] => {
  const result = jobFormSchema.safeParse({ ...valid, ...overrides });
  return result.success ? [] : result.error.issues.map((i) => i.path.join("."));
};

const errorMessages = (overrides: Record<string, unknown>): string[] => {
  const result = jobFormSchema.safeParse({ ...valid, ...overrides });
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe("jobFormSchema", () => {
  it("accepts the minimum viable job", () => {
    expect(jobFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty title", () => {
    expect(errorPaths({ title: "   " })).toContain("title");
  });

  it("rejects a missing recruiter fee", () => {
    expect(errorPaths({ recruiterFee: "" })).toContain("recruiterFee");
  });

  it("rejects a negative recruiter fee", () => {
    expect(errorPaths({ recruiterFee: "-5" })).toContain("recruiterFee");
  });

  it("rejects a state code that is not two characters", () => {
    expect(errorPaths({ locationState: "CAL" })).toContain("locationState");
  });

  // Required outright, so an edit of a job saved before this round has to fill
  // them before it will save at all. Deliberate — see the plan's §7.
  it("requires every Company Info field", () => {
    expect(
      errorPaths({ companyDetails: intakeToFormValues(null).companyDetails }),
    ).toEqual([
      "companyDetails.industry",
      "companyDetails.employeeSize",
      "companyDetails.revenue",
      "companyDetails.yearsInBusiness",
      "companyDetails.whatTheyDo",
    ]);
  });

  it("requires at least one day and both hours on the schedule", () => {
    expect(
      errorPaths({ daysAndHours: { days: [], startHour: "9", endHour: "17" } }),
    ).toContain("daysAndHours.days");
    expect(
      errorPaths({
        daysAndHours: { days: ["mon"], startHour: "", endHour: "" },
      }),
    ).toEqual(["daysAndHours.startHour", "daysAndHours.endHour"]);
  });

  // Overnight shifts are knowingly out of scope: one range covers every
  // selected day, so it has to run forwards.
  it("rejects a schedule whose end hour is not after its start", () => {
    expect(
      errorPaths({
        daysAndHours: { days: ["mon"], startHour: "22", endHour: "6" },
      }),
    ).toContain("daysAndHours.endHour");
    expect(
      errorPaths({
        daysAndHours: { days: ["mon"], startHour: "9", endHour: "9" },
      }),
    ).toContain("daysAndHours.endHour");
  });

  it("rejects an interviewing window that ends before it starts", () => {
    expect(
      errorPaths({
        interviewingAsap: false,
        interviewingFrom: "2026-09-30",
        interviewingTo: "2026-09-01",
      }),
    ).toContain("interviewingTo");
    expect(
      errorPaths({
        interviewingAsap: false,
        interviewingFrom: "2026-09-01",
        interviewingTo: "2026-09-30",
      }),
    ).toEqual([]);
  });

  it("rejects a 401(k) match that is not a percentage", () => {
    const withMatch = (retirement401kMatch: string): string[] =>
      errorPaths({ benefits: { ...valid.benefits, retirement401kMatch } });

    expect(withMatch("101")).toContain("benefits.retirement401kMatch");
    expect(withMatch("four")).toContain("benefits.retirement401kMatch");
    expect(withMatch("4.5")).toEqual([]);
    expect(withMatch("")).toEqual([]);
  });

  it("requires a state on an on-site role, because the job map skips rows without one", () => {
    expect(errorPaths({ locationState: "", workModel: "on_site" })).toContain(
      "locationState",
    );
  });

  it("does not require a state on a remote role, which has none to give", () => {
    expect(errorPaths({ locationState: "", workModel: "remote" })).toEqual([]);
  });

  it("requires a state on a hybrid role, which still has a worksite", () => {
    expect(errorPaths({ locationState: "", workModel: "hybrid" })).toContain(
      "locationState",
    );
  });

  it("still rejects a malformed state code on a remote role", () => {
    expect(errorPaths({ locationState: "CAL", workModel: "remote" })).toContain(
      "locationState",
    );
  });

  it("requires a description, which is what recruiters read before pitching", () => {
    expect(errorPaths({ description: "   " })).toContain("description");
  });

  it("requires an employment type", () => {
    expect(errorPaths({ employmentType: "" })).toContain("employmentType");
  });

  it("requires a pay range", () => {
    expect(errorPaths({ salaryMin: "", salaryMax: "" })).toContain("salaryMin");
  });

  it("requires a city on a role with a worksite", () => {
    expect(errorPaths({ locationCity: "" })).toContain("locationCity");
  });

  it("leaves the worksite and city optional on a remote role", () => {
    expect(
      errorPaths({
        workModel: "remote",
        locationCity: "",
        worksiteAddress: "",
        worksiteZip: "",
      }),
    ).toEqual([]);
  });

  it("rejects a salary maximum below the minimum", () => {
    expect(errorPaths({ salaryMin: "200000", salaryMax: "100000" })).toContain(
      "salaryMax",
    );
  });

  it("rejects a salary maximum equal to the minimum", () => {
    expect(errorPaths({ salaryMin: "100000", salaryMax: "100000" })).toContain(
      "salaryMax",
    );
  });

  it("requires both bounds of the pay range", () => {
    expect(errorPaths({ salaryMin: "100000", salaryMax: "" })).toContain(
      "salaryMax",
    );
  });

  it("rejects a role category outside the enum", () => {
    expect(errorPaths({ roleCategory: "wizardry" })).toContain("roleCategory");
  });

  // Nothing is preselected, so the empty default has to fail validation rather
  // than save whichever category sorts first.
  it("rejects an unpicked role category", () => {
    expect(errorPaths({ roleCategory: "" })).toContain("roleCategory");
  });

  it("accepts a recruiter fee at the $1,000,000,000 ceiling", () => {
    expect(errorPaths({ recruiterFee: "1000000000" })).toEqual([]);
  });

  it("rejects a recruiter fee over the $1,000,000,000 ceiling", () => {
    expect(errorMessages({ recruiterFee: "1000000001" })).toContain(
      "Commission must be under $1,000,000,000",
    );
  });

  it("rejects a recruiter fee given in exponent notation past the ceiling", () => {
    expect(errorMessages({ recruiterFee: "1e20" })).toContain(
      "Commission must be under $1,000,000,000",
    );
  });

  it("accepts a salary minimum at the $1,000,000,000 ceiling", () => {
    expect(
      errorPaths({ salaryMin: "1000000000", salaryMax: "" }),
    ).not.toContain("salaryMin");
  });

  it("rejects a salary minimum over the $1,000,000,000 ceiling", () => {
    expect(errorMessages({ salaryMin: "1000000001" })).toContain(
      "Salary must be under $1,000,000,000",
    );
  });

  it("accepts a salary maximum at the $1,000,000,000 ceiling", () => {
    expect(
      errorPaths({ salaryMin: "", salaryMax: "1000000000" }),
    ).not.toContain("salaryMax");
  });

  it("rejects a salary maximum over the $1,000,000,000 ceiling", () => {
    expect(errorMessages({ salaryMin: "", salaryMax: "1000000001" })).toContain(
      "Salary must be under $1,000,000,000",
    );
  });

  it("still rejects a negative salary minimum", () => {
    expect(errorPaths({ salaryMin: "-5" })).toContain("salaryMin");
  });
});

describe("formatDaysAndHours", () => {
  it("prints the days in week order, whatever order they arrived in", () => {
    expect(
      formatDaysAndHours({
        days: ["fri", "mon", "wed"],
        startHour: 0,
        endHour: 13,
      }),
    ).toBe("Mon, Wed, Fri · 12:00 AM – 1:00 PM");
  });
});

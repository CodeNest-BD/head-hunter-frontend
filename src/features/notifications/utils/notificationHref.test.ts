import { notificationHref } from "./notificationHref";

const notification = (type: string, data: Record<string, unknown> | null) => ({
  id: "n-1",
  type,
  title: "t",
  body: null,
  data,
  readAt: null,
  createdAt: new Date(),
});

describe("notificationHref", () => {
  it("sends a company to the inbox review page", () => {
    expect(
      notificationHref(
        notification("offer_accepted", { submissionId: "sub-1" }),
        "company",
      ),
    ).toBe("/company/inbox/sub-1");
  });

  it("sends a recruiter to their own submission page for the same event", () => {
    expect(
      notificationHref(
        notification("offer_accepted", { submissionId: "sub-1" }),
        "recruiter",
      ),
    ).toBe("/recruiter/submissions/sub-1");
  });

  it("sends a recruiter to the job for a followed-company post", () => {
    expect(
      notificationHref(
        notification("followed_company_posted_job", { jobId: "job-1" }),
        "recruiter",
      ),
    ).toBe("/jobs/job-1");
  });

  it("sends a recruiter to their subscription when it lapses", () => {
    expect(
      notificationHref(
        notification("subscription_past_due", null),
        "recruiter",
      ),
    ).toBe("/recruiter/subscription");
  });

  it("sends a company to the wallet for payout events", () => {
    expect(notificationHref(notification("payout_sent", null), "company")).toBe(
      "/company/wallet",
    );
  });

  it("returns null for a recruiter payout — there is no recruiter wallet page", () => {
    expect(
      notificationHref(notification("payout_sent", null), "recruiter"),
    ).toBeNull();
  });

  it("returns null for an admin rather than falling back to the recruiter route", () => {
    expect(
      notificationHref(
        notification("offer_accepted", { submissionId: "sub-1" }),
        "admin",
      ),
    ).toBeNull();
  });

  it("returns null when the route needs an id the payload does not carry", () => {
    expect(
      notificationHref(notification("offer_accepted", {}), "company"),
    ).toBeNull();
  });

  it("returns null for an unknown type rather than guessing", () => {
    expect(
      notificationHref(
        notification("something_new_from_the_backend", { submissionId: "s" }),
        "company",
      ),
    ).toBeNull();
  });
});

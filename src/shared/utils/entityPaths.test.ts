import { describe, expect, it } from "vitest";

import {
  adminCompanyPath,
  inboxThreadPath,
  jobPath,
  jobRefFromSegment,
  urlRef,
} from "./entityPaths";

const ID = "fb409dfe-a1dc-4dc8-854b-fe48695c1a9e";

describe("urlRef", () => {
  it("prefers the serial number", () => {
    expect(urlRef({ id: ID, serialNumber: 22 })).toBe("22");
    expect(jobPath({ id: ID, serialNumber: 22 })).toBe("/jobs/22");
    expect(inboxThreadPath("company", { id: ID, serialNumber: 7 })).toBe(
      "/company/inbox/7",
    );
  });

  it("falls back to the UUID when the serial is absent", () => {
    expect(urlRef({ id: ID })).toBe(ID);
    expect(adminCompanyPath({ id: ID })).toBe(`/admin/companies/${ID}`);
  });
});

describe("jobRefFromSegment", () => {
  it("pulls the UUID off the end of a legacy slug link", () => {
    expect(jobRefFromSegment(`senior-software-engineer-remote-${ID}`)).toBe(ID);
  });

  it("passes a serial or a bare UUID through", () => {
    expect(jobRefFromSegment("22")).toBe("22");
    expect(jobRefFromSegment(ID)).toBe(ID);
  });
});

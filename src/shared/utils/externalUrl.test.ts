import { describe, expect, it } from "vitest";

import { displayUrl, safeExternalHref } from "./externalUrl";

describe("safeExternalHref", () => {
  it("keeps an ordinary https address", () => {
    expect(safeExternalHref("https://acme.com/about")).toBe(
      "https://acme.com/about",
    );
  });

  it("assumes https when the user gave no scheme", () => {
    // Without this the href is a *relative* path, so clicking a company's
    // website navigates inside the admin app instead of out to the company.
    expect(safeExternalHref("acme.com")).toBe("https://acme.com/");
  });

  it("refuses a javascript: URL", () => {
    // zod's .url() accepts this, and the one person who would click it is an
    // admin reviewing an account they do not trust yet.
    expect(safeExternalHref("javascript:alert(1)")).toBeNull();
  });

  it.each(["data:text/html,<script>", "vbscript:msgbox", "file:///etc/passwd"])(
    "refuses %s",
    (value) => {
      expect(safeExternalHref(value)).toBeNull();
    },
  );

  it("allows plain http, which is unsafe to trust but safe to open", () => {
    expect(safeExternalHref("http://acme.com/")).toBe("http://acme.com/");
  });

  it("treats blank, whitespace and absent values as no link", () => {
    expect(safeExternalHref(null)).toBeNull();
    expect(safeExternalHref(undefined)).toBeNull();
    expect(safeExternalHref("")).toBeNull();
    expect(safeExternalHref("   ")).toBeNull();
  });

  it("returns null rather than throwing on something unparseable", () => {
    expect(safeExternalHref("http://")).toBeNull();
  });
});

describe("displayUrl", () => {
  it("drops the scheme and a trailing slash", () => {
    expect(displayUrl("https://acme.com/")).toBe("acme.com");
    expect(displayUrl("http://acme.com/about")).toBe("acme.com/about");
  });
});

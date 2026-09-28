import { describe, expect, it } from "vitest";
import { cn } from "@/shared/libs/shadCnConfig";

describe("cn with the design system's named scales", () => {
  it("keeps a text color alongside a type role", () => {
    expect(cn("text-sub", "text-white", "text-block")).toBe(
      "text-white text-block",
    );
  });
  it("still lets one type role replace another", () => {
    expect(cn("text-sub", "text-page")).toBe("text-page");
  });
  it("still lets one text color replace another", () => {
    expect(cn("text-white", "text-ink")).toBe("text-ink");
  });
  it("treats rounded-xs as a radius, not a colour", () => {
    expect(cn("rounded-sm", "rounded-xs")).toBe("rounded-xs");
  });
});

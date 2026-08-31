import { describe, expect, it } from "vitest";

import { addChip } from "./ChipListField";

const limits = { max: 3, maxLength: 10 };

describe("addChip", () => {
  it("adds a trimmed entry with internal whitespace collapsed", () => {
    expect(addChip([], "  Go   lang ", limits).next).toEqual(["Go lang"]);
  });

  it("ignores a blank draft without complaining at the user", () => {
    const { next, rejection } = addChip(["Go"], "   ", limits);
    expect(next).toEqual(["Go"]);
    expect(rejection?.reason).toBe("empty");
    expect(rejection?.message).toBe("");
  });

  it("rejects a duplicate regardless of case and spacing", () => {
    expect(addChip(["Go lang"], "go   LANG", limits).rejection?.reason).toBe(
      "duplicate",
    );
  });

  it("rejects an entry over the length limit", () => {
    expect(addChip([], "12345678901", limits).rejection?.reason).toBe(
      "tooLong",
    );
  });

  it("rejects an entry past the count limit", () => {
    expect(addChip(["a", "b", "c"], "d", limits).rejection?.reason).toBe(
      "full",
    );
  });
});

import { useState } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  MAX_SPECIALIZATIONS,
  SPECIALIZATION_SUGGESTIONS,
} from "@/shared/utils/specializations";
import { useSpecializationsField } from "./useSpecializationsField";

const TECHNOLOGY = "technology";
const FIRST_15_SLUGS = SPECIALIZATION_SUGGESTIONS.slice(
  0,
  MAX_SPECIALIZATIONS,
).map((s) => s.value);
const UNSELECTED_SLUG = SPECIALIZATION_SUGGESTIONS[MAX_SPECIALIZATIONS].value;

/** A controlled harness mirroring how a Controller-driven form field wires
 * `value`/`onChange` into the hook. */
function useHarness(initial: string[] = []) {
  const [value, setValue] = useState(initial);
  const field = useSpecializationsField({ value, onChange: setValue });
  return { value, ...field };
}

describe("useSpecializationsField", () => {
  it("selects a suggestion chip by its slug", () => {
    const { result } = renderHook(() => useHarness([]));

    act(() => result.current.toggle(TECHNOLOGY));

    expect(result.current.value).toEqual([TECHNOLOGY]);
  });

  it("deselects a suggestion chip that was already selected", () => {
    const { result } = renderHook(() => useHarness([TECHNOLOGY]));

    act(() => result.current.toggle(TECHNOLOGY));

    expect(result.current.value).toEqual([]);
  });

  it("refuses to select past the maximum number of specializations", () => {
    const { result } = renderHook(() => useHarness([...FIRST_15_SLUGS]));

    act(() => result.current.toggle(UNSELECTED_SLUG));

    expect(result.current.value).toEqual(FIRST_15_SLUGS);
    expect(result.current.error).toMatch(/up to 15/);
  });

  it("adds a normalized custom entry, stored verbatim, as a new chip", () => {
    const { result } = renderHook(() => useHarness([]));

    act(() => result.current.setDraft("  Renewable   Energy  "));
    act(() => result.current.commitAdd());

    expect(result.current.value).toEqual(["Renewable Energy"]);
    expect(result.current.chips.map((c) => c.value)).toContain(
      "Renewable Energy",
    );
  });

  it("selects the curated slug instead of adding a typed label as a duplicate", () => {
    const { result } = renderHook(() => useHarness([]));

    act(() => result.current.setDraft("Human resources"));
    act(() => result.current.commitAdd());

    expect(result.current.value).toEqual(["human_resources"]);
  });

  it("matches a slug-style entry to its suggestion regardless of separators", () => {
    const { result } = renderHook(() => useHarness([]));

    act(() => result.current.setDraft("skilled-trades"));
    act(() => result.current.commitAdd());

    expect(result.current.value).toEqual(["skilled_trades"]);
  });

  it("is a no-op when the typed value already matches a selected suggestion", () => {
    const { result } = renderHook(() => useHarness([TECHNOLOGY]));

    act(() => result.current.setDraft("TECHNOLOGY"));
    act(() => result.current.commitAdd());

    expect(result.current.value).toEqual([TECHNOLOGY]);
  });

  it("is a no-op when the typed value already matches a selected custom entry", () => {
    const { result } = renderHook(() => useHarness(["Renewable Energy"]));

    act(() => result.current.setDraft("renewable energy"));
    act(() => result.current.commitAdd());

    expect(result.current.value).toEqual(["Renewable Energy"]);
  });

  it("rejects a custom entry longer than 60 characters without adding it", () => {
    const { result } = renderHook(() => useHarness([]));
    const tooLong = "a".repeat(61);

    act(() => result.current.setDraft(tooLong));
    act(() => result.current.commitAdd());

    expect(result.current.value).toEqual([]);
    expect(result.current.error).toMatch(/60 characters/);
  });

  it("rejects a new custom entry once the maximum is reached", () => {
    const { result } = renderHook(() => useHarness([...FIRST_15_SLUGS]));

    act(() => result.current.setDraft("Renewable Energy"));
    act(() => result.current.commitAdd());

    expect(result.current.value).toEqual(FIRST_15_SLUGS);
    expect(result.current.error).toMatch(/up to 15/);
  });

  it("does nothing for a blank draft", () => {
    const { result } = renderHook(() => useHarness([]));

    act(() => result.current.setDraft("   "));
    act(() => result.current.commitAdd());

    expect(result.current.value).toEqual([]);
    expect(result.current.isAdding).toBe(false);
  });
});

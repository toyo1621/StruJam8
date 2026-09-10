import { describe, expect, it } from "vitest";
import type { PlayableCodeLine } from "./codegen";
import {
  getActiveCodeLineIndexes,
  getActiveCodeRuleIds,
  getActiveCodeRuleId,
  getHighlightableRuleIds,
  getHighlightableTargets,
  joinCodeLines,
} from "./codeHighlight";

const lines: PlayableCodeLine[] = [
  { text: "stack(" },
  { text: "  drums,", targetId: "drums" },
  { text: "  bass", targetId: "bass" },
  { text: "    .degradeBy(0.2)", targetId: "bass", ruleId: "bass-drop" },
  { text: "    .distort(0.4)", targetId: "bass", ruleId: "bass-drive" },
  { text: ")" },
];

describe("code highlight helpers", () => {
  it("joins rendered code lines into the exact audible code string", () => {
    expect(joinCodeLines(lines)).toBe("stack(\n  drums,\n  bass\n    .degradeBy(0.2)\n    .distort(0.4)\n)");
  });

  it("returns highlightable target ids in display order", () => {
    expect(getHighlightableTargets(lines)).toEqual(["drums", "bass"]);
  });

  it("highlights every rendered line for the active target", () => {
    expect([...getActiveCodeLineIndexes(lines, 0)]).toEqual([1]);
    expect([...getActiveCodeLineIndexes(lines, 1)]).toEqual([2, 3, 4]);
    expect([...getActiveCodeLineIndexes(lines, 2)]).toEqual([1]);
  });

  it("cycles through rule ids in rendered code order", () => {
    expect(getHighlightableRuleIds(lines)).toEqual(["bass-drop", "bass-drive"]);
    expect(getActiveCodeRuleId(lines, 0)).toBeNull();
    expect(getActiveCodeRuleId(lines, 1)).toBe("bass-drop");
    expect(getActiveCodeRuleId(lines, 2)).toBeNull();
    expect(getActiveCodeRuleId(lines, 3)).toBe("bass-drive");
  });

  it("maps active rendered lines to their rules", () => {
    expect([...getActiveCodeRuleIds(lines, new Set([3]))]).toEqual(["bass-drop"]);
  });

  it("falls back to every rule on an active target for broad locations", () => {
    expect([...getActiveCodeRuleIds(lines, new Set([2]))]).toEqual([
      "bass-drop",
      "bass-drive",
    ]);
  });
});

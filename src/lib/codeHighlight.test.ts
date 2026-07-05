import { describe, expect, it } from "vitest";
import type { PlayableCodeLine } from "./codegen";
import { getActiveCodeLineIndexes, getHighlightableTargets, joinCodeLines } from "./codeHighlight";

const lines: PlayableCodeLine[] = [
  { text: "stack(" },
  { text: "  drums,", targetId: "drums" },
  { text: "  bass", targetId: "bass" },
  { text: "    .degradeBy(0.2)", targetId: "bass" },
  { text: ")" },
];

describe("code highlight helpers", () => {
  it("joins rendered code lines into the exact audible code string", () => {
    expect(joinCodeLines(lines)).toBe("stack(\n  drums,\n  bass\n    .degradeBy(0.2)\n)");
  });

  it("returns highlightable target ids in display order", () => {
    expect(getHighlightableTargets(lines)).toEqual(["drums", "bass"]);
  });

  it("highlights every rendered line for the active target", () => {
    expect([...getActiveCodeLineIndexes(lines, 0)]).toEqual([1]);
    expect([...getActiveCodeLineIndexes(lines, 1)]).toEqual([2, 3]);
    expect([...getActiveCodeLineIndexes(lines, 2)]).toEqual([1]);
  });
});

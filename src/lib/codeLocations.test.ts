import { describe, expect, it } from "vitest";
import { tokenizeCodeLine } from "./codeTokens";
import {
  getActiveCodeLineIndexesFromLocations,
  getActiveCodeTokenIndexes,
  getCodeLineOffsets,
  getCodeTokenSegments,
} from "./codeLocations";

describe("code location helpers", () => {
  it("calculates source offsets across rendered lines", () => {
    expect(getCodeLineOffsets(["stack(", "  note(\"c2\")", ")"])).toEqual([0, 7, 20]);
  });

  it("finds the line and token containing a Strudel location", () => {
    const lines = ["stack(", '  note("c2 eb2").s("sawtooth")', ")"];
    const source = lines.join("\n");
    const noteStart = source.indexOf("c2");
    const tokens = tokenizeCodeLine(lines[1] ?? "");

    expect([...getActiveCodeLineIndexesFromLocations(lines, [{ start: noteStart, end: noteStart + 2 }])]).toEqual([1]);
    expect([...getActiveCodeTokenIndexes(7, tokens, [{ start: noteStart, end: noteStart + 2 }])]).toEqual([
      tokens.findIndex((token) => token.text === '"c2 eb2"'),
    ]);
  });

  it("splits a token so only the active mini leaf is highlighted", () => {
    const tokenText = '"c2 eb2"';
    const tokenStart = 9;
    const segments = getCodeTokenSegments(tokenStart, tokenText, [{ start: 10, end: 12 }]);

    expect(segments).toEqual([
      { text: '"', isActive: false },
      { text: "c2", isActive: true },
      { text: ' eb2"', isActive: false },
    ]);
  });

  it("does not activate empty or non-overlapping ranges", () => {
    expect([...getActiveCodeLineIndexesFromLocations(["note(\"c2\")"], [])]).toEqual([]);
    expect([...getActiveCodeTokenIndexes(0, tokenizeCodeLine("note(\"c2\")"), [{ start: 40, end: 42 }])]).toEqual([]);
  });
});

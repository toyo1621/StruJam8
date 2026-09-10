import { describe, expect, it } from "vitest";
import { tokenizeCodeLine } from "./codeTokens";

describe("code tokenization", () => {
  it("keeps the rendered code line exactly intact", () => {
    const source = '  note("c2 ~ eb2").s("sawtooth").gain(0.45)';
    const tokens = tokenizeCodeLine(source);

    expect(tokens.map((token) => token.text).join("")).toBe(source);
  });

  it("classifies Strudel-like functions, strings, numbers, and punctuation", () => {
    const tokens = tokenizeCodeLine('  note("c2").gain(0.45)');

    expect(tokens.find((token) => token.text === "note")?.kind).toBe("function");
    expect(tokens.some((token) => token.kind === "string")).toBe(true);
    expect(tokens.find((token) => token.text === "0.45")?.kind).toBe("number");
    expect(tokens.filter((token) => token.kind === "punctuation")).toHaveLength(5);
  });

  it("keeps comments as one non-executable token", () => {
    const tokens = tokenizeCodeLine("  // TODO: verify");

    expect(tokens[tokens.length - 1]).toEqual({ text: "// TODO: verify", kind: "comment" });
  });
});

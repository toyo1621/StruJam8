import { describe, expect, it } from "vitest";
import { createJamShareUrl, jamUrlParam, parseJamShareUrl } from "./shareUrl";
import type { Rule } from "../types";

function makeRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: "rule-1",
    targetId: "bass",
    intentId: "break",
    techniqueId: "bass-break-drop-notes",
    target: "ベース",
    intent: "崩す",
    technique: "音を抜く",
    shortLabel: "抜く",
    strudelSnippet: ".degradeBy(0.2)",
    needsTodo: false,
    enabled: true,
    ...overrides,
  };
}

describe("jam share URL", () => {
  it("encodes and decodes a jam snapshot in the URL", () => {
    const rule = makeRule();
    const url = createJamShareUrl("https://example.com/strujam?view=pad#dock", {
      selectedPresetId: "neon-dub",
      rules: [rule],
    });

    expect(new URL(url).searchParams.has(jamUrlParam)).toBe(true);
    expect(new URL(url).searchParams.get("view")).toBe("pad");
    expect(new URL(url).hash).toBe("#dock");
    expect(parseJamShareUrl(url)).toEqual({
      version: 1,
      selectedPresetId: "neon-dub",
      rules: [rule],
    });
  });

  it("replaces an existing jam parameter", () => {
    const url = createJamShareUrl("https://example.com/?jam=old", {
      selectedPresetId: "toy-house",
      rules: [],
    });

    expect(new URL(url).searchParams.getAll(jamUrlParam)).toHaveLength(1);
    expect(parseJamShareUrl(url)?.selectedPresetId).toBe("toy-house");
  });

  it("returns null for URLs without valid jam data", () => {
    expect(parseJamShareUrl("https://example.com/")).toBeNull();
    expect(parseJamShareUrl("https://example.com/?jam=not-json")).toBeNull();
    expect(parseJamShareUrl("not a url")).toBeNull();
  });
});

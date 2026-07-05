import { describe, expect, it } from "vitest";
import { getPresetDefinition } from "../data/presets";
import {
  formatGeneratedCode,
  formatPlayableCode,
  getEnabledRules,
  groupRulesByTrack,
  initialCode,
} from "./codegen";
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

describe("formatGeneratedCode", () => {
  it("returns the Toy House starter code when there are no enabled rules", () => {
    expect(formatGeneratedCode([])).toBe(initialCode);
    expect(formatGeneratedCode([makeRule({ enabled: false })])).toBe(initialCode);
  });

  it("returns the selected preset base code when there are no enabled rules", () => {
    const neonDub = getPresetDefinition("neon-dub");

    expect(formatGeneratedCode([], neonDub)).toBe(neonDub.baseCode);
  });

  it("composes enabled snippets onto the target track base pattern", () => {
    const output = formatGeneratedCode([makeRule()]);

    expect(output).toContain("/* ベース ＞ 崩す ＞ 音を抜く */");
    expect(output).toContain('bass:\n  note("c2 ~ eb2 g2").s("sawtooth").lpf(900).gain(0.45)\n    .degradeBy(0.2)');
  });

  it("uses target ids to choose drum track names and base patterns", () => {
    const output = formatGeneratedCode([
      makeRule({
        targetId: "drums",
        intentId: "dance",
        techniqueId: "drums-dance-tight-hats",
        target: "ドラム",
        intent: "踊らせる",
        technique: "ハット細かく",
        strudelSnippet: ".fast(2)",
      }),
    ]);

    expect(output).toContain("/* ドラム ＞ 踊らせる ＞ ハット細かく */");
    expect(output).toContain('drums:\n  stack(s("sbd*4").gain(0.8), s("~ pink ~ pink").decay(0.06).gain(0.35), s("white*8").decay(0.03).hpf(5000).gain(0.22))\n    .fast(2)');
  });

  it("uses the selected preset track pattern when composing a rule", () => {
    const neonDub = getPresetDefinition("neon-dub");
    const output = formatGeneratedCode([makeRule()], neonDub);

    expect(output).toContain('bass:\n  note("c2 ~ c2 bb1").s("sawtooth").lpf(750).gain(0.5)\n    .degradeBy(0.2)');
  });

  it("uses target ids to choose guitar track names and base patterns", () => {
    const output = formatGeneratedCode([
      makeRule({
        targetId: "guitar",
        intentId: "forward",
        techniqueId: "guitar-forward-light-drive",
        target: "ギター",
        intent: "前に出す",
        technique: "軽く歪ませる",
        strudelSnippet: ".distort(0.25)",
      }),
    ]);

    expect(output).toContain("/* ギター ＞ 前に出す ＞ 軽く歪ませる */");
    expect(output).toContain('guitar:\n  note("c3 eb3 g3 bb3").s("sawtooth").decay(0.18).lpf(1700).gain(0.24)\n    .distort(0.25)');
  });

  it("marks unverified snippets with a TODO comment next to the technique", () => {
    const output = formatGeneratedCode([makeRule({ needsTodo: true })]);

    expect(output).toContain("// TODO: Strudelで動作確認する: 音を抜く");
  });

  it("groups multiple rules for the same track into one composed chain", () => {
    const output = formatGeneratedCode([
      makeRule({ id: "first", technique: "音を抜く", strudelSnippet: ".degradeBy(0.2)" }),
      makeRule({ id: "second", technique: "歪ませる", strudelSnippet: ".distort(0.4)" }),
    ]);

    expect(output.match(/^bass:/gm)).toHaveLength(1);
    expect(output).toContain('bass:\n  note("c2 ~ eb2 g2").s("sawtooth").lpf(900).gain(0.45)\n    .degradeBy(0.2)\n    .distort(0.4)');
    expect(output.indexOf("音を抜く")).toBeLessThan(output.indexOf("歪ませる"));
    expect(output.indexOf(".degradeBy(0.2)")).toBeLessThan(output.indexOf(".distort(0.4)"));
  });

  it("does not include disabled rules in generated code", () => {
    const output = formatGeneratedCode([
      makeRule({ id: "disabled", enabled: false, technique: "音を反転", strudelSnippet: ".rev()" }),
      makeRule({ id: "enabled" }),
    ]);

    expect(output).not.toContain("音を反転");
    expect(output).not.toContain(".rev()");
    expect(output).toContain("音を抜く");
  });

  it("keeps a visible TODO line for missing snippets", () => {
    const output = formatGeneratedCode([
      makeRule({
        techniqueId: "fallback-technique-1",
        technique: "手法1",
        strudelSnippet: null,
      }),
    ]);

    expect(output).toContain("// TODO: 手法1 のstrudelSnippetを定義する");
    expect(output).toContain("    // TODO: 手法1 snippet");
  });
});

describe("formatPlayableCode", () => {
  it("returns the visible preset base code when there are no playable rules", () => {
    expect(formatPlayableCode([])).toBe(initialCode);
    expect(formatPlayableCode([makeRule({ enabled: false })])).toBe(initialCode);
  });

  it("creates a Strudel expression from the preset playback tracks", () => {
    const output = formatPlayableCode([makeRule()]);

    expect(output).toContain("stack(");
    expect(output).toContain('note("c2 ~ eb2 g2").s("sawtooth").lpf(900).gain(0.45)');
    expect(output).toContain(".degradeBy(0.2)");
    expect(output).not.toContain("gm_strings");
    expect(output).not.toContain("gm_celesta");
    expect(output).not.toContain('note("c3 ~ eb3 g3")');
    expect(output).not.toContain("[ah oh]");
    expect(output).not.toContain("bass:");
    expect(output).not.toContain("/*");
  });

  it("adds a playable rule target when it is outside the preset base tracks", () => {
    const output = formatPlayableCode([
      makeRule({
        targetId: "guitar",
        intentId: "forward",
        target: "ギター",
        intent: "前に出す",
        technique: "軽く歪ませる",
        strudelSnippet: ".distort(0.25)",
      }),
    ]);

    expect(output).toContain('note("c3 eb3 g3 bb3").s("sawtooth").decay(0.18).lpf(1700).gain(0.24)');
    expect(output).toContain(".distort(0.25)");
  });

  it("skips disabled, missing, and unverified snippets for safer playback", () => {
    const output = formatPlayableCode([
      makeRule({ id: "disabled", enabled: false, strudelSnippet: ".rev()" }),
      makeRule({ id: "missing", technique: "手法1", strudelSnippet: null }),
      makeRule({ id: "todo", technique: "フィル前に", strudelSnippet: ".every(4, x => x.fast(2))", needsTodo: true }),
      makeRule({ id: "safe", strudelSnippet: ".distort(0.4)" }),
    ]);

    expect(output).toContain(".distort(0.4)");
    expect(output).not.toContain(".rev()");
    expect(output).not.toContain(".every(4");
    expect(output).not.toContain("TODO");
  });
});

describe("getEnabledRules", () => {
  it("keeps only enabled rules", () => {
    const rules = [makeRule({ id: "on" }), makeRule({ id: "off", enabled: false })];

    expect(getEnabledRules(rules).map((rule) => rule.id)).toEqual(["on"]);
  });
});

describe("groupRulesByTrack", () => {
  it("preserves first-seen track order and rule order inside each track", () => {
    const groups = groupRulesByTrack([
      makeRule({ id: "bass-1" }),
      makeRule({
        id: "guitar-1",
        targetId: "guitar",
        intentId: "forward",
        target: "ギター",
        intent: "前に出す",
        technique: "軽く歪ませる",
        strudelSnippet: ".distort(0.25)",
      }),
      makeRule({ id: "bass-2", technique: "歪ませる", strudelSnippet: ".distort(0.4)" }),
    ]);

    expect(groups.map((group) => group.track.codeName)).toEqual(["bass", "guitar"]);
    expect(groups[0]?.rules.map((rule) => rule.id)).toEqual(["bass-1", "bass-2"]);
  });
});

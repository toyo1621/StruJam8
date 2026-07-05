import { describe, expect, it } from "vitest";
import type { Rule } from "../types";
import {
  formatRuleActionsGroupLabel,
  formatRuleDetailActionLabel,
  formatRuleDuplicateActionLabel,
  formatRuleMoveActionLabel,
  formatRuleRemoveActionLabel,
  formatRuleToggleActionLabel,
  formatTransportActionLabel,
  transportUiDescription,
} from "./accessibilityLabels";

const rule: Rule = {
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
};

describe("accessibility labels", () => {
  it("formats rule action labels with the full route", () => {
    expect(formatRuleActionsGroupLabel(rule)).toBe("ベース ＞ 崩す ＞ 音を抜く の操作");
    expect(formatRuleDetailActionLabel(rule)).toBe("ベース ＞ 崩す ＞ 音を抜く の詳細を表示");
    expect(formatRuleMoveActionLabel(rule, "up")).toBe("ベース ＞ 崩す ＞ 音を抜く を上へ移動");
    expect(formatRuleMoveActionLabel(rule, "down")).toBe("ベース ＞ 崩す ＞ 音を抜く を下へ移動");
    expect(formatRuleDuplicateActionLabel(rule)).toBe("ベース ＞ 崩す ＞ 音を抜く を複製");
    expect(formatRuleToggleActionLabel(rule)).toBe("ベース ＞ 崩す ＞ 音を抜く をOFFにする");
    expect(formatRuleToggleActionLabel({ ...rule, enabled: false })).toBe(
      "ベース ＞ 崩す ＞ 音を抜く をONにする",
    );
    expect(formatRuleRemoveActionLabel(rule)).toBe("ベース ＞ 崩す ＞ 音を抜く を削除");
  });

  it("keeps transport labels explicit about the Strudel audio preview", () => {
    expect(transportUiDescription).toContain("Strudel audio preview");
    expect(transportUiDescription).toContain("hushes");
    expect(formatTransportActionLabel("play")).toBe("Start Strudel audio preview");
    expect(formatTransportActionLabel("stop")).toBe("Stop Strudel audio preview");
  });
});

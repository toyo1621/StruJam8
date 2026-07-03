import { describe, expect, it } from "vitest";
import type { Rule } from "../types";
import {
  formatRedoAnnouncement,
  formatRuleAddedAnnouncement,
  formatRuleDuplicatedAnnouncement,
  formatRuleMovedAnnouncement,
  formatRuleRemovedAnnouncement,
  formatRuleToggledAnnouncement,
  formatRulesResetAnnouncement,
  formatUndoAnnouncement,
  resetRulesControlCopy,
} from "./announcements";

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

describe("announcement helpers", () => {
  it("formats rule lifecycle announcements", () => {
    expect(formatRuleAddedAnnouncement(rule)).toBe("ベース ＞ 崩す ＞ 音を抜く を追加しました。");
    expect(formatRuleRemovedAnnouncement(rule)).toBe("ベース ＞ 崩す ＞ 音を抜く を削除しました。");
  });

  it("formats edit announcements", () => {
    expect(formatRuleToggledAnnouncement(rule, false)).toBe("ベース ＞ 崩す ＞ 音を抜く をOFFにしました。");
    expect(formatRuleMovedAnnouncement(rule, "up")).toBe("ベース ＞ 崩す ＞ 音を抜く を上へ移動しました。");
    expect(formatRuleDuplicatedAnnouncement(rule)).toBe("ベース ＞ 崩す ＞ 音を抜く を複製しました。");
  });

  it("formats reset and undo announcements", () => {
    expect(formatRulesResetAnnouncement(2)).toBe(
      "ルールを2件リセットしました。現在地とPresetはそのままです。UNDOで戻せます。",
    );
    expect(formatRulesResetAnnouncement(0)).toBe(
      "リセットするルールはありません。現在地とPresetはそのままです。",
    );
    expect(formatUndoAnnouncement()).toBe("ひとつ前のルール状態に戻しました。");
    expect(formatRedoAnnouncement()).toBe("取り消したルール状態をやり直しました。");
  });

  it("keeps reset control semantics explicit for assistive UI", () => {
    expect(resetRulesControlCopy.label).toBe("RESET");
    expect(resetRulesControlCopy.ariaLabel).toContain("追加したルールだけ");
    expect(resetRulesControlCopy.ariaLabel).toContain("現在地とPresetはそのまま");
    expect(resetRulesControlCopy.ariaLabel).toContain("UNDOで戻せます");
  });
});

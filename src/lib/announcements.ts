import type { MoveDirection } from "../state/appReducer";
import type { Rule } from "../types";

export const resetRulesControlCopy = {
  label: "RESET",
  ariaLabel: "RESET: 追加したルールだけを消します。現在地とPresetはそのままで、UNDOで戻せます。",
  title: "追加したルールだけを消します。現在地とPresetはそのままです。UNDOで戻せます。",
} as const;

export function formatRuleRoute(rule: Rule) {
  return `${rule.target} ＞ ${rule.intent} ＞ ${rule.technique}`;
}

export function formatRuleAddedAnnouncement(rule: Rule) {
  return `${formatRuleRoute(rule)} を追加しました。`;
}

export function formatRuleToggledAnnouncement(rule: Rule, nextEnabled: boolean) {
  return `${formatRuleRoute(rule)} を${nextEnabled ? "ON" : "OFF"}にしました。`;
}

export function formatRuleMovedAnnouncement(rule: Rule, direction: MoveDirection) {
  return `${formatRuleRoute(rule)} を${direction === "up" ? "上" : "下"}へ移動しました。`;
}

export function formatRuleDuplicatedAnnouncement(rule: Rule) {
  return `${formatRuleRoute(rule)} を複製しました。`;
}

export function formatRuleRemovedAnnouncement(rule: Rule) {
  return `${formatRuleRoute(rule)} を削除しました。`;
}

export function formatRulesResetAnnouncement(ruleCount: number) {
  return ruleCount > 0
    ? `ルールを${ruleCount}件リセットしました。現在地とPresetはそのままです。UNDOで戻せます。`
    : "リセットするルールはありません。現在地とPresetはそのままです。";
}

export function formatUndoAnnouncement() {
  return "ひとつ前のルール状態に戻しました。";
}

export function formatRedoAnnouncement() {
  return "取り消したルール状態をやり直しました。";
}

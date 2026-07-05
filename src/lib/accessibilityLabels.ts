import type { MoveDirection } from "../state/appReducer";
import type { Rule } from "../types";
import { formatRuleRoute } from "./announcements";

export const transportUiDescription =
  "Play starts the first Strudel audio preview. Stop hushes the Strudel audio engine.";

export function formatRuleDetailActionLabel(rule: Rule) {
  return `${formatRuleRoute(rule)} の詳細を表示`;
}

export function formatRuleMoveActionLabel(rule: Rule, direction: MoveDirection) {
  return `${formatRuleRoute(rule)} を${direction === "up" ? "上" : "下"}へ移動`;
}

export function formatRuleDuplicateActionLabel(rule: Rule) {
  return `${formatRuleRoute(rule)} を複製`;
}

export function formatRuleToggleActionLabel(rule: Rule) {
  return `${formatRuleRoute(rule)} を${rule.enabled ? "OFF" : "ON"}にする`;
}

export function formatRuleRemoveActionLabel(rule: Rule) {
  return `${formatRuleRoute(rule)} を削除`;
}

export function formatRuleActionsGroupLabel(rule: Rule) {
  return `${formatRuleRoute(rule)} の操作`;
}

export function formatTransportActionLabel(action: "play" | "stop") {
  return action === "play" ? "Start Strudel audio preview" : "Stop Strudel audio preview";
}

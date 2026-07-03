import type { MoveDirection } from "../state/appReducer";
import type { Rule } from "../types";
import { formatRuleRoute } from "./announcements";

export const transportUiDescription =
  "Play and Stop only change the visual transport state in v0. Audio playback is not implemented yet.";

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
  return action === "play"
    ? "Set transport UI to Play. Audio playback is not implemented yet."
    : "Set transport UI to Stop. Audio playback is not implemented yet.";
}

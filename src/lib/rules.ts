import type { Rule, TechniqueDefinition } from "../types";

export const maxJamRules = 128;
export const maxJamSnapshotBytes = 256 * 1024;

let fallbackIdSequence = 0;

export function createRuleId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Older/insecure local browser contexts may not expose randomUUID.
  return `rule-${Date.now()}-${++fallbackIdSequence}`;
}

export function createRuleFromTechnique(
  technique: TechniqueDefinition,
  id: string = createRuleId(),
  enabled = true,
): Rule {
  return {
    id,
    targetId: technique.targetId,
    intentId: technique.intentId,
    techniqueId: technique.id,
    target: technique.target,
    intent: technique.intent,
    technique: technique.label,
    shortLabel: technique.shortLabel,
    strudelSnippet: technique.strudelSnippet,
    playbackTransform: technique.playbackTransform,
    needsTodo: technique.needsTodo ?? false,
    enabled,
  };
}

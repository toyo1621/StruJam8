import type { Rule, TechniqueDefinition } from "../types";

export const maxJamRules = 128;
export const maxJamSnapshotBytes = 256 * 1024;

export function createRuleId() {
  return crypto.randomUUID();
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

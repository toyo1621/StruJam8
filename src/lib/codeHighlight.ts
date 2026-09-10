import type { PlayableCodeLine } from "./codegen";

export function joinCodeLines(lines: Pick<PlayableCodeLine, "text">[]) {
  return lines.map((line) => line.text).join("\n");
}

export function getHighlightableTargets(lines: PlayableCodeLine[]) {
  const targetIds: string[] = [];

  lines.forEach((line) => {
    if (line.targetId && !targetIds.includes(line.targetId)) {
      targetIds.push(line.targetId);
    }
  });

  return targetIds;
}

export function getActiveCodeLineIndexes(lines: PlayableCodeLine[], pulseIndex: number) {
  const targets = getHighlightableTargets(lines);

  if (targets.length === 0) {
    return new Set<number>();
  }

  const activeTargetId = targets[pulseIndex % targets.length];
  const activeIndexes = lines
    .map((line, index) => (line.targetId === activeTargetId ? index : -1))
    .filter((index) => index >= 0);

  return new Set(activeIndexes);
}

export function getHighlightableRuleIds(lines: Pick<PlayableCodeLine, "ruleId">[]) {
  const ruleIds: string[] = [];

  lines.forEach((line) => {
    if (line.ruleId && !ruleIds.includes(line.ruleId)) {
      ruleIds.push(line.ruleId);
    }
  });

  return ruleIds;
}

export function getActiveCodeRuleId(lines: PlayableCodeLine[], pulseIndex: number) {
  const targetIds = getHighlightableTargets(lines);

  if (targetIds.length === 0) {
    return null;
  }

  const activeTargetId = targetIds[pulseIndex % targetIds.length];
  const ruleIds = getHighlightableRuleIds(
    lines.filter((line) => line.targetId === activeTargetId),
  );

  if (ruleIds.length === 0) {
    return null;
  }

  const ruleIndex = Math.floor(pulseIndex / targetIds.length) % ruleIds.length;
  return ruleIds[ruleIndex] ?? null;
}

export function getActiveCodeRuleIds(
  lines: readonly Pick<PlayableCodeLine, "targetId" | "ruleId">[],
  activeLineIndexes: ReadonlySet<number>,
) {
  const activeRuleIds = new Set<string>();
  const activeTargetIds = new Set<string>();

  activeLineIndexes.forEach((lineIndex) => {
    const line = lines[lineIndex];

    if (!line) {
      return;
    }

    if (line.targetId) {
      activeTargetIds.add(line.targetId);
    }

    if (line.ruleId) {
      activeRuleIds.add(line.ruleId);
    }
  });

  if (activeRuleIds.size > 0) {
    return activeRuleIds;
  }

  // Broad runtime locations can land on a track's base pattern. In that case,
  // keep the rule list in sync with the active target as a useful fallback.
  lines.forEach((line) => {
    if (line.ruleId && line.targetId && activeTargetIds.has(line.targetId)) {
      activeRuleIds.add(line.ruleId);
    }
  });

  return activeRuleIds;
}

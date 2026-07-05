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

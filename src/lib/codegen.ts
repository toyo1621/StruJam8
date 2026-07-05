import { defaultPreset } from "../data/presets";
import { getTrackDefinition } from "../data/tracks";
import type { PresetDefinition, Rule, TargetId, TrackDefinition } from "../types";

export const initialCode = defaultPreset.baseCode;

export interface TrackRuleGroup {
  track: TrackDefinition;
  rules: Rule[];
}

export interface PlayableCodeLine {
  text: string;
  targetId?: TargetId;
}

export function getTrackCodeName(targetId: TargetId) {
  return getTrackDefinition(targetId).codeName;
}

export function getEnabledRules(rules: Rule[]) {
  return rules.filter((rule) => rule.enabled);
}

export function groupRulesByTrack(rules: Rule[]): TrackRuleGroup[] {
  const groups = new Map<TargetId, TrackRuleGroup>();

  rules.forEach((rule) => {
    const existingGroup = groups.get(rule.targetId);

    if (existingGroup) {
      existingGroup.rules.push(rule);
      return;
    }

    groups.set(rule.targetId, {
      track: getTrackDefinition(rule.targetId),
      rules: [rule],
    });
  });

  return [...groups.values()];
}

function formatRuleComment(rule: Rule) {
  return `/* ${rule.target} ＞ ${rule.intent} ＞ ${rule.technique} */`;
}

function formatTodoComment(rule: Rule) {
  if (!rule.strudelSnippet) {
    return `// TODO: ${rule.technique} のstrudelSnippetを定義する`;
  }

  if (rule.needsTodo) {
    return `// TODO: Strudelで動作確認する: ${rule.technique}`;
  }

  return null;
}

function getPresetTrackPattern(track: TrackDefinition, preset: PresetDefinition) {
  return preset.trackPatterns[track.targetId] ?? track.basePattern;
}

function formatSnippetChainLine(rule: Rule) {
  if (!rule.strudelSnippet) {
    return `    // TODO: ${rule.technique} snippet`;
  }

  return `    ${rule.strudelSnippet}`;
}

function getPlayableRules(rules: Rule[]) {
  return getEnabledRules(rules).filter((rule) => rule.strudelSnippet && !rule.needsTodo);
}

function formatPlayableTrackLines(track: TrackDefinition, rules: Rule[], preset: PresetDefinition): PlayableCodeLine[] {
  const snippetChain = rules
    .filter((rule) => rule.targetId === track.targetId)
    .map((rule) => ({
      text: `    ${rule.strudelSnippet}`,
      targetId: track.targetId,
    }));

  return [
    {
      text: `  ${getPresetTrackPattern(track, preset)}`,
      targetId: track.targetId,
    },
    ...snippetChain,
  ];
}

function getPlayableTracks(preset: PresetDefinition, rules: Rule[]) {
  const targetIds = new Set<TargetId>(preset.playbackTrackIds);

  rules.forEach((rule) => targetIds.add(rule.targetId));

  return [...targetIds].map(getTrackDefinition);
}

export function formatPlayableCodeLines(rules: Rule[], preset: PresetDefinition = defaultPreset): PlayableCodeLine[] {
  const playableRules = getPlayableRules(rules);
  const tracks = getPlayableTracks(preset, playableRules);
  const lines: PlayableCodeLine[] = [{ text: "stack(" }];

  tracks.forEach((track, trackIndex) => {
    const trackLines = formatPlayableTrackLines(track, playableRules, preset);
    const isLastTrack = trackIndex === tracks.length - 1;
    const lastLine = trackLines[trackLines.length - 1];

    if (lastLine && !isLastTrack) {
      lastLine.text += ",";
    }

    lines.push(...trackLines);
  });

  lines.push({ text: ")" });

  return lines;
}

export function formatPlayableCode(rules: Rule[], preset: PresetDefinition = defaultPreset) {
  return formatPlayableCodeLines(rules, preset)
    .map((line) => line.text)
    .join("\n");
}

export function formatComposedTrackSnippet(group: TrackRuleGroup, preset: PresetDefinition = defaultPreset) {
  const routeComments = group.rules.map(formatRuleComment);
  const todoComments = group.rules.map(formatTodoComment).filter((comment) => comment !== null);
  const snippetChain = group.rules.map(formatSnippetChainLine);
  const composedTrack = [
    `${group.track.codeName}:`,
    `  ${getPresetTrackPattern(group.track, preset)}`,
    ...snippetChain,
  ].join("\n");

  return [...routeComments, ...todoComments, composedTrack].join("\n");
}

export function formatRuleSnippet(rule: Rule, preset: PresetDefinition = defaultPreset) {
  return formatComposedTrackSnippet(
    {
      track: getTrackDefinition(rule.targetId),
      rules: [rule],
    },
    preset,
  );
}

export function formatGeneratedCode(rules: Rule[], preset: PresetDefinition = defaultPreset) {
  const enabledRules = getEnabledRules(rules);

  if (enabledRules.length === 0) {
    return preset.baseCode;
  }

  const trackSnippets = groupRulesByTrack(enabledRules)
    .map((group) => formatComposedTrackSnippet(group, preset))
    .join("\n\n");

  return `${preset.baseCode}\n\n${trackSnippets}`;
}

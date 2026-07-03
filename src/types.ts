export type CurrentLevel = "target" | "intent" | "technique";

export type PresetId = "toy-house" | "neon-dub";

export type TargetId =
  | "drums"
  | "bass"
  | "chords"
  | "keys"
  | "strings"
  | "bells"
  | "guitar"
  | "voice";

export type IntentId =
  | "build"
  | "break"
  | "dance"
  | "remove"
  | "random"
  | "chill"
  | "widen"
  | "forward";

export interface RouteSelection<TId extends string = string> {
  id: TId;
  label: string;
}

export interface PadOption extends RouteSelection {
  color: string;
  shortLabel?: string;
}

export interface TargetDefinition extends PadOption {
  id: TargetId;
  trackName: string;
}

export interface IntentDefinition extends PadOption {
  id: IntentId;
}

export interface TrackDefinition {
  targetId: TargetId;
  label: string;
  codeName: string;
  basePattern: string;
  description: string;
}
export interface PresetDefinition {
  id: PresetId;
  name: string;
  description: string;
  baseCode: string;
  trackPatterns: Partial<Record<TargetId, string>>;
}

export interface RouteDefinition {
  targetId: TargetId;
  intentId: IntentId;
  target: string;
  intent: string;
  description: string;
}

export interface TechniqueDefinition {
  id: string;
  label: string;
  shortLabel: string;
  targetId: TargetId;
  intentId: IntentId;
  target: string;
  intent: string;
  description: string;
  strudelSnippet: string;
  snippetExplanation: string;
  needsTodo?: boolean;
}

export interface Rule {
  id: string;
  targetId: TargetId;
  intentId: IntentId;
  techniqueId: string;
  target: string;
  intent: string;
  technique: string;
  shortLabel: string;
  strudelSnippet: string | null;
  needsTodo: boolean;
  enabled: boolean;
}

export interface PersistedJamSnapshot {
  version: 1;
  selectedPresetId: PresetId;
  rules: Rule[];
}

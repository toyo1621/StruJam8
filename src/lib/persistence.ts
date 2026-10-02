import { intents, targets } from "../data/pads";
import { isPresetId } from "../data/presets";
import { getTechniqueById, getTechniquesByRoute } from "../data/techniques";
import { createRuleFromTechnique, maxJamRules, maxJamSnapshotBytes } from "./rules";
import type { IntentId, PersistedJamSnapshot, Rule, TargetId } from "../types";

export const jamStorageKey = "strujam8:jam:v1";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type PersistableJamSnapshot = Pick<PersistedJamSnapshot, "selectedPresetId" | "rules">;

const targetIds = new Set<TargetId>(targets.map((target) => target.id));
const intentIds = new Set<IntentId>(intents.map((intent) => intent.id));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTargetId(value: unknown): value is TargetId {
  return typeof value === "string" && targetIds.has(value as TargetId);
}

function isIntentId(value: unknown): value is IntentId {
  return typeof value === "string" && intentIds.has(value as IntentId);
}

function restoreRule(value: unknown): Rule | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" || value.id.length === 0 || value.id.length > 128 ||
    !isTargetId(value.targetId) || !isIntentId(value.intentId) ||
    typeof value.techniqueId !== "string" || typeof value.enabled !== "boolean"
  ) {
    return null;
  }

  const technique = getTechniqueById(value.techniqueId);
  if (technique) {
    if (technique.targetId !== value.targetId || technique.intentId !== value.intentId) return null;
    // External snapshots select catalog entries; they never supply executable code or labels.
    return createRuleFromTechnique(technique, value.id, value.enabled);
  }

  const fallback = /^fallback-technique-([1-8])$/.exec(value.techniqueId);
  if (!fallback || getTechniquesByRoute(value.targetId, value.intentId).length > 0) return null;
  const label = `手法${fallback[1]}`;
  return {
    id: value.id,
    targetId: value.targetId,
    intentId: value.intentId,
    techniqueId: value.techniqueId,
    target: targets.find((target) => target.id === value.targetId)!.label,
    intent: intents.find((intent) => intent.id === value.intentId)!.label,
    technique: label,
    shortLabel: label,
    strudelSnippet: null,
    needsTodo: false,
    enabled: value.enabled,
  };
}

function parseSnapshot(value: unknown): PersistedJamSnapshot | null {
  if (!isRecord(value) || value.version !== 1 || !isPresetId(value.selectedPresetId)) {
    return null;
  }

  if (!Array.isArray(value.rules) || value.rules.length > maxJamRules) {
    return null;
  }

  const rules: Rule[] = [];
  const ids = new Set<string>();
  for (const entry of value.rules) {
    const rule = restoreRule(entry);
    if (!rule || ids.has(rule.id)) return null;
    ids.add(rule.id);
    rules.push(rule);
  }
  return {
    version: 1,
    selectedPresetId: value.selectedPresetId,
    rules,
  };
}

export function createJamSnapshot(snapshot: PersistableJamSnapshot): PersistedJamSnapshot {
  return {
    version: 1,
    selectedPresetId: snapshot.selectedPresetId,
    rules: snapshot.rules,
  };
}

export function serializeJamSnapshot(snapshot: PersistableJamSnapshot) {
  return JSON.stringify(createJamSnapshot(snapshot), null, 2);
}

export function parseJamSnapshotText(text: string): PersistedJamSnapshot | null {
  if (text.length > maxJamSnapshotBytes || new TextEncoder().encode(text).byteLength > maxJamSnapshotBytes) {
    return null;
  }
  try {
    return parseSnapshot(JSON.parse(text));
  } catch {
    return null;
  }
}

export function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadJamSnapshot(storage: StorageLike | null): PersistedJamSnapshot | null {
  if (!storage) {
    return null;
  }

  try {
    const rawSnapshot = storage.getItem(jamStorageKey);

    if (!rawSnapshot) {
      return null;
    }

    return parseJamSnapshotText(rawSnapshot);
  } catch {
    return null;
  }
}

export function saveJamSnapshot(
  storage: StorageLike | null,
  snapshot: PersistableJamSnapshot,
) {
  if (!storage || snapshot.rules.length > maxJamRules) {
    return false;
  }

  try {
    storage.setItem(jamStorageKey, serializeJamSnapshot(snapshot));
    return true;
  } catch {
    return false;
  }
}

export function clearJamSnapshot(storage: StorageLike | null) {
  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(jamStorageKey);
    return true;
  } catch {
    return false;
  }
}

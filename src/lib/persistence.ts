import { intents, targets } from "../data/pads";
import { isPresetId } from "../data/presets";
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

function isRule(value: unknown): value is Rule {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    isTargetId(value.targetId) &&
    isIntentId(value.intentId) &&
    typeof value.techniqueId === "string" &&
    typeof value.target === "string" &&
    typeof value.intent === "string" &&
    typeof value.technique === "string" &&
    typeof value.shortLabel === "string" &&
    (typeof value.strudelSnippet === "string" || value.strudelSnippet === null) &&
    typeof value.needsTodo === "boolean" &&
    typeof value.enabled === "boolean"
  );
}

function parseSnapshot(value: unknown): PersistedJamSnapshot | null {
  if (!isRecord(value) || value.version !== 1 || !isPresetId(value.selectedPresetId)) {
    return null;
  }

  if (!Array.isArray(value.rules)) {
    return null;
  }

  return {
    version: 1,
    selectedPresetId: value.selectedPresetId,
    rules: value.rules.filter(isRule),
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
  if (!storage) {
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

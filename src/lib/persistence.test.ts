import { describe, expect, it } from "vitest";
import {
  clearJamSnapshot,
  createJamSnapshot,
  jamStorageKey,
  loadJamSnapshot,
  parseJamSnapshotText,
  saveJamSnapshot,
  serializeJamSnapshot,
} from "./persistence";
import type { Rule } from "../types";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

function makeRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: "rule-1",
    targetId: "bass",
    intentId: "break",
    techniqueId: "bass-break-drop-notes",
    target: "ベース",
    intent: "崩す",
    technique: "音を抜く",
    shortLabel: "抜く",
    strudelSnippet: ".degradeBy(0.2)",
    needsTodo: false,
    enabled: true,
    ...overrides,
  };
}

describe("jam persistence", () => {
  it("saves and loads rules with the selected preset", () => {
    const storage = new MemoryStorage();
    const rule = makeRule();

    expect(saveJamSnapshot(storage, { selectedPresetId: "neon-dub", rules: [rule] })).toBe(true);

    expect(loadJamSnapshot(storage)).toEqual({
      version: 1,
      selectedPresetId: "neon-dub",
      rules: [rule],
    });
  });

  it("returns null for missing, malformed, or unsupported snapshots", () => {
    const storage = new MemoryStorage();

    expect(loadJamSnapshot(storage)).toBeNull();

    storage.setItem(jamStorageKey, "not json");
    expect(loadJamSnapshot(storage)).toBeNull();

    storage.setItem(jamStorageKey, JSON.stringify({ version: 2, selectedPresetId: "toy-house", rules: [] }));
    expect(loadJamSnapshot(storage)).toBeNull();

    storage.setItem(jamStorageKey, JSON.stringify({ version: 1, selectedPresetId: "missing", rules: [] }));
    expect(loadJamSnapshot(storage)).toBeNull();
  });

  it("filters invalid rules from otherwise valid snapshots", () => {
    const storage = new MemoryStorage();
    const validRule = makeRule();
    storage.setItem(
      jamStorageKey,
      JSON.stringify({
        version: 1,
        selectedPresetId: "toy-house",
        rules: [validRule, { ...validRule, id: 10 }, { ...validRule, targetId: "missing" }],
      }),
    );

    expect(loadJamSnapshot(storage)?.rules).toEqual([validRule]);
  });

  it("serializes and parses exportable jam JSON", () => {
    const rule = makeRule();
    const json = serializeJamSnapshot({ selectedPresetId: "neon-dub", rules: [rule] });

    expect(JSON.parse(json)).toEqual(createJamSnapshot({ selectedPresetId: "neon-dub", rules: [rule] }));
    expect(parseJamSnapshotText(json)).toEqual({
      version: 1,
      selectedPresetId: "neon-dub",
      rules: [rule],
    });
  });

  it("returns null when import JSON is invalid", () => {
    expect(parseJamSnapshotText("not json")).toBeNull();
    expect(parseJamSnapshotText(JSON.stringify({ version: 1, selectedPresetId: "toy-house" }))).toBeNull();
  });

  it("clears saved snapshots", () => {
    const storage = new MemoryStorage();
    saveJamSnapshot(storage, { selectedPresetId: "toy-house", rules: [makeRule()] });

    expect(clearJamSnapshot(storage)).toBe(true);
    expect(loadJamSnapshot(storage)).toBeNull();
  });

  it("returns false when storage is unavailable", () => {
    expect(saveJamSnapshot(null, { selectedPresetId: "toy-house", rules: [] })).toBe(false);
    expect(clearJamSnapshot(null)).toBe(false);
    expect(loadJamSnapshot(null)).toBeNull();
  });
});

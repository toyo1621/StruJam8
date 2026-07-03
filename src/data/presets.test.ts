import { describe, expect, it } from "vitest";
import { targets } from "./pads";
import { defaultPreset, defaultPresetId, getPresetDefinition, presets } from "./presets";

describe("preset catalog", () => {
  it("defines unique preset ids", () => {
    const ids = presets.map((preset) => preset.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses Toy House as the default preset", () => {
    expect(defaultPresetId).toBe("toy-house");
    expect(defaultPreset.name).toBe("Toy House");
  });

  it("provides base code, descriptions, and all target track patterns", () => {
    const targetIds = targets.map((target) => target.id).sort();

    presets.forEach((preset) => {
      expect(preset.baseCode.trim().length).toBeGreaterThan(0);
      expect(preset.description.trim().length).toBeGreaterThan(0);
      expect(Object.keys(preset.trackPatterns).sort()).toEqual(targetIds);
      expect(
        Object.values(preset.trackPatterns).every((pattern) => pattern.trim().length > 0),
      ).toBe(true);
    });
  });

  it("returns Neon Dub preset metadata", () => {
    expect(getPresetDefinition("neon-dub")).toMatchObject({
      name: "Neon Dub",
    });
  });
});

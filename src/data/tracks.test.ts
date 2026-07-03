import { describe, expect, it } from "vitest";
import { targets } from "./pads";
import { getTrackDefinition, tracks } from "./tracks";

describe("track templates", () => {
  it("defines one track template for every target pad", () => {
    expect(tracks.map((track) => track.targetId)).toEqual(targets.map((target) => target.id));
  });

  it("uses unique code names", () => {
    const codeNames = tracks.map((track) => track.codeName);

    expect(new Set(codeNames).size).toBe(codeNames.length);
  });

  it("includes base patterns and learning descriptions", () => {
    expect(
      tracks.every(
        (track) => track.basePattern.trim().length > 0 && track.description.trim().length > 0,
      ),
    ).toBe(true);
  });

  it("returns guitar track metadata", () => {
    expect(getTrackDefinition("guitar")).toMatchObject({
      label: "ギター",
      codeName: "guitar",
    });
  });
});

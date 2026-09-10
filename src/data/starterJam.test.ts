import { describe, expect, it } from "vitest";
import { getTechniqueById } from "./techniques";
import { starterJam } from "./starterJam";

describe("starter jam", () => {
  it("references exactly two playable techniques", () => {
    const techniques = starterJam.techniqueIds.map((id) => getTechniqueById(id));

    expect(techniques).toHaveLength(2);
    expect(techniques.every((technique) => technique && !technique.needsTodo)).toBe(true);
    expect(techniques.map((technique) => technique?.label)).toEqual(["音を抜く", "高い音を足す"]);
  });
});

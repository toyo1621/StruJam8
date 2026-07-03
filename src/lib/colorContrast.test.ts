import { describe, expect, it } from "vitest";
import { intents, targets } from "../data/pads";
import {
  livePadTextColor,
  minimumLivePadContrastRatio,
  techniquePalette,
} from "../data/padColors";
import { getContrastRatio, meetsContrastRatio, parseHexColor } from "./colorContrast";

describe("color contrast helpers", () => {
  it("parses six-digit hex colors", () => {
    expect(parseHexColor("#101217")).toEqual({ red: 16, green: 18, blue: 23 });
  });

  it("calculates contrast ratio for black and white", () => {
    expect(getContrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 2);
  });

  it("keeps live pad text above the minimum contrast ratio", () => {
    const livePadColors = [
      ...targets.map((target) => ({ name: `target:${target.id}`, color: target.color })),
      ...intents.map((intent) => ({ name: `intent:${intent.id}`, color: intent.color })),
      ...techniquePalette.map((color, index) => ({ name: `technique:${index + 1}`, color })),
    ];

    const failures = livePadColors
      .map((padColor) => ({
        ...padColor,
        ratio: getContrastRatio(livePadTextColor, padColor.color),
      }))
      .filter((padColor) => padColor.ratio < minimumLivePadContrastRatio);

    expect(failures).toEqual([]);
    expect(
      livePadColors.every((padColor) =>
        meetsContrastRatio(livePadTextColor, padColor.color, minimumLivePadContrastRatio),
      ),
    ).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { getProjectLink, projectLinks } from "./projectLinks";

describe("project links", () => {
  it("defines stable source and license links", () => {
    expect(projectLinks.map((link) => link.id)).toEqual(["source", "license"]);
    expect(getProjectLink("source").href).toBe("https://github.com/toyo1621/StruJam8");
    expect(getProjectLink("license").href).toBe(
      "https://github.com/toyo1621/StruJam8/blob/main/LICENSE",
    );
  });

  it("keeps links usable for external navigation", () => {
    expect(
      projectLinks.every(
        (link) =>
          link.label.trim().length > 0 &&
          link.ariaLabel.trim().length > 0 &&
          link.href.startsWith("https://"),
      ),
    ).toBe(true);
  });
});

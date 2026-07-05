import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App shell", () => {
  it("renders the public jam controls and transport shell", () => {
    const html = renderToString(<App />);

    expect(html).toContain("STRUJAM8");
    expect(html).toContain("Export JSON");
    expect(html).toContain("Import JSON");
    expect(html).toContain("Share URL");
    expect(html).toContain("Play");
    expect(html).toContain("Strudel Code");
  });
});

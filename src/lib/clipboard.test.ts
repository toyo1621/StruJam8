import { describe, expect, it, vi } from "vitest";
import { copyTextToClipboard, getCopyStatusLabel } from "./clipboard";

describe("copyTextToClipboard", () => {
  it("copies text through the provided clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    await expect(copyTextToClipboard("stack()", { writeText })).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith("stack()");
  });

  it("returns empty without writing blank text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    await expect(copyTextToClipboard("   ", { writeText })).resolves.toBe("empty");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("returns unsupported when no clipboard is available", async () => {
    await expect(copyTextToClipboard("stack()", null)).resolves.toBe("unsupported");
  });

  it("returns failed when the clipboard rejects", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));

    await expect(copyTextToClipboard("stack()", { writeText })).resolves.toBe("failed");
  });
});

describe("getCopyStatusLabel", () => {
  it("formats user-facing copy states", () => {
    expect(getCopyStatusLabel("copied")).toBe("Copied");
    expect(getCopyStatusLabel("unsupported")).toBe("Clipboard unavailable");
    expect(getCopyStatusLabel("failed")).toBe("Copy failed");
    expect(getCopyStatusLabel("idle")).toBe("");
  });
});

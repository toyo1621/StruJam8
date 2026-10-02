import { afterEach, describe, expect, it, vi } from "vitest";
import { createRuleId } from "./rules";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("rule IDs", () => {
  it("uses randomUUID when available", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "native-uuid" });
    expect(createRuleId()).toBe("native-uuid");
  });

  it("keeps same-millisecond fallback IDs distinct without crypto", () => {
    vi.stubGlobal("crypto", undefined);
    vi.spyOn(Date, "now").mockReturnValue(123);
    const ids = Array.from({ length: 100 }, createRuleId);
    expect(new Set(ids).size).toBe(100);
    expect(ids.every((id) => id.startsWith("rule-123-"))).toBe(true);
  });
});

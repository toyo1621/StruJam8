import { describe, expect, it } from "vitest";
import {
  getPadShortcutIndex,
  getPadShortcutIndexFromEvent,
  isEditableShortcutTarget,
} from "./keyboard";

describe("keyboard helpers", () => {
  it("maps number keys 1-8 to zero-based pad indexes", () => {
    expect(getPadShortcutIndex("1")).toBe(0);
    expect(getPadShortcutIndex("4")).toBe(3);
    expect(getPadShortcutIndex("8")).toBe(7);
  });

  it("ignores keys outside the live pad range", () => {
    expect(getPadShortcutIndex("0")).toBeNull();
    expect(getPadShortcutIndex("9")).toBeNull();
    expect(getPadShortcutIndex("a")).toBeNull();
  });

  it("detects editable shortcut targets", () => {
    expect(isEditableShortcutTarget({ tagName: "INPUT" })).toBe(true);
    expect(isEditableShortcutTarget({ tagName: "textarea" })).toBe(true);
    expect(isEditableShortcutTarget({ tagName: "SELECT" })).toBe(true);
    expect(isEditableShortcutTarget({ isContentEditable: true })).toBe(true);
    expect(isEditableShortcutTarget({ getAttribute: () => "textbox" })).toBe(true);
    expect(isEditableShortcutTarget({ tagName: "BUTTON" })).toBe(false);
    expect(isEditableShortcutTarget(null)).toBe(false);
  });

  it("returns a pad index only for unmodified shortcut events outside editing controls", () => {
    expect(getPadShortcutIndexFromEvent({ key: "3", target: { tagName: "BUTTON" } })).toBe(2);
    expect(getPadShortcutIndexFromEvent({ key: "3", ctrlKey: true })).toBeNull();
    expect(getPadShortcutIndexFromEvent({ key: "3", metaKey: true })).toBeNull();
    expect(getPadShortcutIndexFromEvent({ key: "3", shiftKey: true })).toBeNull();
    expect(getPadShortcutIndexFromEvent({ key: "3", defaultPrevented: true })).toBeNull();
    expect(getPadShortcutIndexFromEvent({ key: "3", target: { tagName: "INPUT" } })).toBeNull();
    expect(getPadShortcutIndexFromEvent({ key: "9", target: { tagName: "BUTTON" } })).toBeNull();
  });
});

export interface ShortcutTargetLike {
  tagName?: string;
  isContentEditable?: boolean;
  getAttribute?: (name: string) => string | null;
}

export interface PadShortcutEventLike {
  key: string;
  defaultPrevented?: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  target?: ShortcutTargetLike | EventTarget | null;
}

const editableTagNames = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function getPadShortcutIndex(key: string): number | null {
  if (!/^[1-8]$/.test(key)) {
    return null;
  }

  return Number(key) - 1;
}

export function isEditableShortcutTarget(target: PadShortcutEventLike["target"]) {
  if (!target || typeof target !== "object") {
    return false;
  }

  const candidate = target as ShortcutTargetLike;
  const tagName = typeof candidate.tagName === "string" ? candidate.tagName.toUpperCase() : "";
  const role = typeof candidate.getAttribute === "function" ? candidate.getAttribute("role") : null;

  return candidate.isContentEditable === true || editableTagNames.has(tagName) || role === "textbox";
}

export function getPadShortcutIndexFromEvent(event: PadShortcutEventLike): number | null {
  if (
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    isEditableShortcutTarget(event.target)
  ) {
    return null;
  }

  return getPadShortcutIndex(event.key);
}

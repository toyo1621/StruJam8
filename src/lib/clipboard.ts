export interface ClipboardLike {
  writeText(text: string): Promise<void>;
}

export type CopyTextResult = "copied" | "empty" | "unsupported" | "failed";

export function getBrowserClipboard(): ClipboardLike | null {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return null;
  }

  return navigator.clipboard;
}

export async function copyTextToClipboard(
  text: string,
  clipboard: ClipboardLike | null,
): Promise<CopyTextResult> {
  if (text.trim().length === 0) {
    return "empty";
  }

  if (!clipboard) {
    return "unsupported";
  }

  try {
    await clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

export function getCopyStatusLabel(status: CopyTextResult | "idle") {
  switch (status) {
    case "copied":
      return "Copied";
    case "empty":
      return "No code";
    case "unsupported":
      return "Clipboard unavailable";
    case "failed":
      return "Copy failed";
    default:
      return "";
  }
}

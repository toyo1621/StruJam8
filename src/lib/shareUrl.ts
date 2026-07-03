import { parseJamSnapshotText, serializeJamSnapshot, type PersistableJamSnapshot } from "./persistence";
import type { PersistedJamSnapshot } from "../types";

export const jamUrlParam = "jam";

export function createJamShareUrl(baseUrl: string, snapshot: PersistableJamSnapshot) {
  const url = new URL(baseUrl);

  url.searchParams.set(jamUrlParam, serializeJamSnapshot(snapshot));

  return url.toString();
}

export function parseJamShareUrl(urlText: string): PersistedJamSnapshot | null {
  try {
    const url = new URL(urlText);
    const snapshotText = url.searchParams.get(jamUrlParam);

    if (!snapshotText) {
      return null;
    }

    return parseJamSnapshotText(snapshotText);
  } catch {
    return null;
  }
}

export function getBrowserHref() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.location.href;
}
